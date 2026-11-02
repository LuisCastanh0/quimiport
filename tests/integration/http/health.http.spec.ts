import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { criarServidorDeTeste, type TestServerContext } from "../../support/test-server.js";

/** Recorte mínimo do documento OpenAPI — só o que estas asserções inspecionam. */
interface JsonLike {
  $ref?: string;
  allOf?: JsonLike[];
  [chave: string]: unknown;
}

interface OpenApiMedia {
  content?: Record<string, { schema?: JsonLike }>;
}

interface OpenApiOperacao {
  requestBody?: OpenApiMedia;
  responses?: Record<string, OpenApiMedia>;
}

interface OpenApiDoc {
  paths: Record<string, Record<string, OpenApiOperacao>>;
  components?: { schemas?: Record<string, JsonLike> };
}

describe("GET /health", () => {
  let ctx: TestServerContext;

  beforeAll(async () => {
    ctx = await criarServidorDeTeste();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it("retorna 200 com status ok", async () => {
    const resposta = await ctx.app.inject({ method: "GET", url: "/health" });
    expect(resposta.statusCode).toBe(200);
    expect(resposta.json()).toMatchObject({ status: "ok", bancoDeDados: "conectado" });
  });

  it("expõe a documentação Swagger em /docs e /docs/json", async () => {
    const json = await ctx.app.inject({ method: "GET", url: "/docs/json" });
    expect(json.statusCode).toBe(200);
    expect(json.json()).toHaveProperty("openapi");

    const ui = await ctx.app.inject({ method: "GET", url: "/docs" });
    expect([200, 302]).toContain(ui.statusCode);
  });

  it("não deixa nenhum $ref órfão em components.schemas", async () => {
    const spec = (await ctx.app.inject({ method: "GET", url: "/docs/json" })).json();
    const definidos = Object.keys(spec.components?.schemas ?? {});
    const referenciados = [
      ...new Set(
        (JSON.stringify(spec).match(/#\/components\/schemas\/[A-Za-z0-9_]+/g) ?? []).map((ref) =>
          ref.split("/").pop(),
        ),
      ),
    ];

    expect(referenciados.length).toBeGreaterThan(0);
    expect(referenciados.filter((nome) => !definidos.includes(nome as string))).toEqual([]);
  });

  it("documenta exemplo de request e de response em cada operação", async () => {
    const spec = (await ctx.app.inject({ method: "GET", url: "/docs/json" })).json() as OpenApiDoc;
    const schemas = spec.components?.schemas ?? {};

    /** Segue `$ref` (e `allOf`, usado quando um body reaproveita outro) até achar um `example`. */
    const temExemplo = (schema: JsonLike | undefined, vistos = new Set<string>()): boolean => {
      if (!schema) return false;

      if (typeof schema.$ref === "string") {
        const nome = schema.$ref.split("/").pop() as string;
        if (vistos.has(nome)) return false;
        vistos.add(nome);
        return temExemplo(schemas[nome], vistos);
      }

      const { allOf, ...resto } = schema;
      if (JSON.stringify(resto).includes('"example"')) return true;
      return Array.isArray(allOf) && allOf.some((parte) => temExemplo(parte, vistos));
    };

    const semExemplo: string[] = [];
    for (const [caminho, operacoes] of Object.entries(spec.paths)) {
      for (const [metodo, operacao] of Object.entries(operacoes)) {
        const rotulo = `${metodo.toUpperCase()} ${caminho}`;

        const body = operacao.requestBody?.content?.["application/json"]?.schema;
        if (body && !temExemplo(body)) semExemplo.push(`${rotulo} (request)`);

        const sucesso = Object.entries(operacao.responses ?? {}).find(([codigo]) =>
          codigo.startsWith("2"),
        );
        const resposta = sucesso?.[1].content?.["application/json"]?.schema;
        if (resposta && !temExemplo(resposta)) semExemplo.push(`${rotulo} (response)`);
      }
    }

    expect(semExemplo).toEqual([]);
  });
});
