import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { criarServidorDeTeste, type TestServerContext } from "../../support/test-server.js";

async function criarProduto(ctx: TestServerContext, overrides: Record<string, unknown> = {}) {
  const resposta = await ctx.app.inject({
    method: "POST",
    url: "/produtos-quimicos",
    payload: {
      nome: `Produto ${Math.random()}`,
      classeRisco: "8",
      grupoCompatibilidade: "A",
      ...overrides,
    },
  });
  return resposta.json();
}

async function criarRt(ctx: TestServerContext) {
  const resposta = await ctx.app.inject({
    method: "POST",
    url: "/responsaveis-tecnicos",
    payload: { nome: "RT de Teste", registroNumero: "CRQ-1", registroOrgao: "CRQ" },
  });
  return resposta.json();
}

async function registrarCarga(
  ctx: TestServerContext,
  produtoId: string,
  rtId: string,
  overrides: Record<string, unknown> = {},
) {
  const resposta = await ctx.app.inject({
    method: "POST",
    url: "/cargas-quimicas",
    payload: {
      produtoQuimicoId: produtoId,
      quantidade: { valor: 100, unidadeMedida: "kg" },
      origem: "Terminal A",
      destino: "Armazém B",
      responsavelTecnicoId: rtId,
      ...overrides,
    },
  });
  return resposta;
}

const DOCS_OBRIGATORIOS = [
  { tipo: "FichaSeguranca", numero: "FS-1" },
  { tipo: "LaudoTecnico", numero: "LT-1" },
  { tipo: "LicencaTransporte", numero: "LIC-1" },
];

async function anexarDocumentacaoValida(ctx: TestServerContext, cargaId: string) {
  for (const doc of DOCS_OBRIGATORIOS) {
    const adicionado = await ctx.app.inject({
      method: "POST",
      url: `/cargas-quimicas/${cargaId}/documentos`,
      payload: {
        tipo: doc.tipo,
        numero: doc.numero,
        dataEmissao: "2026-01-01T00:00:00.000Z",
        dataValidade: "2030-01-01T00:00:00.000Z",
      },
    });
    await ctx.app.inject({
      method: "PATCH",
      url: `/cargas-quimicas/${cargaId}/documentos/${adicionado.json().id}/validacao`,
      payload: { status: "Valido" },
    });
  }
}

describe("Cargas Químicas (HTTP)", () => {
  let ctx: TestServerContext;

  beforeAll(async () => {
    ctx = await criarServidorDeTeste();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it("POST /cargas-quimicas registra carga com status Registrada (201)", async () => {
    const produto = await criarProduto(ctx);
    const rt = await criarRt(ctx);
    const resposta = await registrarCarga(ctx, produto.id, rt.id);
    expect(resposta.statusCode).toBe(201);
    expect(resposta.json().status).toBe("Registrada");
  });

  it("RN02/RN10 — 422 ao registrar carga com produto inativo", async () => {
    const produto = await criarProduto(ctx);
    await ctx.app.inject({ method: "PATCH", url: `/produtos-quimicos/${produto.id}/inativar` });
    const rt = await criarRt(ctx);
    const resposta = await registrarCarga(ctx, produto.id, rt.id);
    expect(resposta.statusCode).toBe(422);
    expect(resposta.json().regra).toBe("RN02");
  });

  it.each([0, -5])("RN11 — 400 para quantidade %s", async (valor) => {
    const produto = await criarProduto(ctx);
    const rt = await criarRt(ctx);
    const resposta = await registrarCarga(ctx, produto.id, rt.id, {
      quantidade: { valor, unidadeMedida: "kg" },
    });
    expect(resposta.statusCode).toBe(400);
  });

  it("RN04/RN17 — 422 ao tentar avançar status sem documentação obrigatória", async () => {
    const produto = await criarProduto(ctx);
    const rt = await criarRt(ctx);
    const carga = (await registrarCarga(ctx, produto.id, rt.id)).json();

    await ctx.app.inject({
      method: "PATCH",
      url: `/cargas-quimicas/${carga.id}/status`,
      payload: { status: "EmAnalise" },
    });
    const resposta = await ctx.app.inject({
      method: "PATCH",
      url: `/cargas-quimicas/${carga.id}/status`,
      payload: { status: "EmInspecao" },
    });
    expect(resposta.statusCode).toBe(422);
    expect(resposta.json().codigo).toBe("REGRA_DE_NEGOCIO");
  });

  it("fluxo completo: Registrada -> ... -> Finalizada (200/201 em cada etapa)", async () => {
    const produto = await criarProduto(ctx);
    const rt = await criarRt(ctx);
    const carga = (await registrarCarga(ctx, produto.id, rt.id)).json();

    await anexarDocumentacaoValida(ctx, carga.id);

    const paraAnalise = await ctx.app.inject({
      method: "PATCH",
      url: `/cargas-quimicas/${carga.id}/status`,
      payload: { status: "EmAnalise" },
    });
    expect(paraAnalise.statusCode).toBe(200);

    const paraInspecao = await ctx.app.inject({
      method: "PATCH",
      url: `/cargas-quimicas/${carga.id}/status`,
      payload: { status: "EmInspecao" },
    });
    expect(paraInspecao.statusCode).toBe(200);

    const aceite = await ctx.app.inject({
      method: "PATCH",
      url: `/cargas-quimicas/${carga.id}/aceite-responsavel-tecnico`,
      payload: { responsavelTecnicoId: rt.id },
    });
    expect(aceite.statusCode).toBe(200);

    const inspecao = await ctx.app.inject({
      method: "POST",
      url: `/cargas-quimicas/${carga.id}/inspecoes`,
      payload: {
        dataInspecao: "2026-01-02T00:00:00.000Z",
        inspetorResponsavel: "Inspetora de Teste",
        resultado: "Aprovada",
      },
    });
    expect(inspecao.statusCode).toBe(201);

    const liberada = await ctx.app.inject({
      method: "PATCH",
      url: `/cargas-quimicas/${carga.id}/liberar`,
    });
    expect(liberada.statusCode).toBe(200);
    expect(liberada.json().status).toBe("Liberada");

    const movimentacao = await ctx.app.inject({
      method: "PATCH",
      url: `/cargas-quimicas/${carga.id}/status`,
      payload: { status: "EmMovimentacao" },
    });
    expect(movimentacao.statusCode).toBe(200);

    const finalizada = await ctx.app.inject({
      method: "PATCH",
      url: `/cargas-quimicas/${carga.id}/status`,
      payload: { status: "Finalizada" },
    });
    expect(finalizada.statusCode).toBe(200);
    expect(finalizada.json().status).toBe("Finalizada");

    const historico = await ctx.app.inject({
      method: "GET",
      url: `/cargas-quimicas/${carga.id}/historico`,
    });
    expect(historico.statusCode).toBe(200);
    expect(historico.json().data).toHaveLength(6);
  });

  it("RN14 — 409 TRANSICAO_INVALIDA para Cancelada -> Liberada", async () => {
    const produto = await criarProduto(ctx);
    const rt = await criarRt(ctx);
    const carga = (await registrarCarga(ctx, produto.id, rt.id)).json();
    await ctx.app.inject({
      method: "PATCH",
      url: `/cargas-quimicas/${carga.id}/cancelar`,
      payload: { motivo: "Teste" },
    });
    const resposta = await ctx.app.inject({
      method: "PATCH",
      url: `/cargas-quimicas/${carga.id}/liberar`,
    });
    expect(resposta.statusCode).toBe(409);
    expect(resposta.json().codigo).toBe("TRANSICAO_INVALIDA");
  });

  it("RN05 — 409 ao tentar mover carga bloqueada", async () => {
    const produto = await criarProduto(ctx);
    const rt = await criarRt(ctx);
    const carga = (await registrarCarga(ctx, produto.id, rt.id)).json();
    await anexarDocumentacaoValida(ctx, carga.id);
    await ctx.app.inject({
      method: "PATCH",
      url: `/cargas-quimicas/${carga.id}/status`,
      payload: { status: "EmAnalise" },
    });
    await ctx.app.inject({
      method: "PATCH",
      url: `/cargas-quimicas/${carga.id}/status`,
      payload: { status: "EmInspecao" },
    });
    await ctx.app.inject({
      method: "PATCH",
      url: `/cargas-quimicas/${carga.id}/bloquear`,
      payload: { motivo: "Risco identificado" },
    });
    const resposta = await ctx.app.inject({
      method: "PATCH",
      url: `/cargas-quimicas/${carga.id}/status`,
      payload: { status: "EmMovimentacao" },
    });
    expect(resposta.statusCode).toBe(409);
  });

  it("GET /cargas-quimicas filtra por status; status desconhecido retorna 400", async () => {
    const resposta = await ctx.app.inject({ method: "GET", url: "/cargas-quimicas?status=Registrada" });
    expect(resposta.statusCode).toBe(200);

    const invalido = await ctx.app.inject({ method: "GET", url: "/cargas-quimicas?status=NaoExiste" });
    expect(invalido.statusCode).toBe(400);
  });

  it("5xx nunca expõe stack trace no corpo da resposta", async () => {
    const resposta = await ctx.app.inject({
      method: "GET",
      url: "/cargas-quimicas/não-é-um-uuid",
    });
    expect(resposta.statusCode).toBe(400);
    expect(JSON.stringify(resposta.json())).not.toMatch(/at [A-Za-z]+\./);
  });
});
