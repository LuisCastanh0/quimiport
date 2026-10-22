import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { criarServidorDeTeste, type TestServerContext } from "../../support/test-server.js";

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
});
