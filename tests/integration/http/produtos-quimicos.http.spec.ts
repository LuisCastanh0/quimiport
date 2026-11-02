import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { criarServidorDeTeste, type TestServerContext } from "../../support/test-server.js";

describe("Produtos Químicos (HTTP)", () => {
  let ctx: TestServerContext;

  beforeAll(async () => {
    ctx = await criarServidorDeTeste();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it("POST /produtos-quimicos cria um produto (201)", async () => {
    const resposta = await ctx.app.inject({
      method: "POST",
      url: "/produtos-quimicos",
      payload: { nome: "Hidróxido de Sódio", classeRisco: "8", grupoCompatibilidade: "A" },
    });
    expect(resposta.statusCode).toBe(201);
    const corpo = resposta.json();
    expect(corpo.status).toBe("Ativo");
    expect(corpo.categoriaPerigo).toBe("Substâncias corrosivas");
  });

  it("RN08 — 400 ao cadastrar produto sem nome", async () => {
    const resposta = await ctx.app.inject({
      method: "POST",
      url: "/produtos-quimicos",
      payload: { nome: "", classeRisco: "3", grupoCompatibilidade: "A" },
    });
    expect(resposta.statusCode).toBe(400);
    expect(resposta.json().codigo).toBe("VALIDACAO");
  });

  it("RN09 — 400 ao cadastrar produto sem classe de risco", async () => {
    const resposta = await ctx.app.inject({
      method: "POST",
      url: "/produtos-quimicos",
      payload: { nome: "Produto Sem Classe", grupoCompatibilidade: "A" },
    });
    expect(resposta.statusCode).toBe(400);
  });

  it("GET /produtos-quimicos lista produtos paginados", async () => {
    const resposta = await ctx.app.inject({ method: "GET", url: "/produtos-quimicos?page=1&limit=20" });
    expect(resposta.statusCode).toBe(200);
    expect(resposta.json()).toHaveProperty("meta.total");
  });

  it("GET /produtos-quimicos/:id retorna 404 para id inexistente", async () => {
    const resposta = await ctx.app.inject({
      method: "GET",
      url: "/produtos-quimicos/00000000-0000-0000-0000-000000000000",
    });
    expect(resposta.statusCode).toBe(404);
    expect(resposta.json().codigo).toBe("NAO_ENCONTRADO");
  });

  it("PATCH /produtos-quimicos/:id/inativar inativa e depois rejeita duplicado (409)", async () => {
    const criado = await ctx.app.inject({
      method: "POST",
      url: "/produtos-quimicos",
      payload: { nome: "Produto Para Inativar", classeRisco: "2", grupoCompatibilidade: "B" },
    });
    const id = criado.json().id;

    const inativado = await ctx.app.inject({ method: "PATCH", url: `/produtos-quimicos/${id}/inativar` });
    expect(inativado.statusCode).toBe(200);
    expect(inativado.json().status).toBe("Inativo");

    const repetido = await ctx.app.inject({ method: "PATCH", url: `/produtos-quimicos/${id}/inativar` });
    expect(repetido.statusCode).toBe(409);
    expect(repetido.json().codigo).toBe("CONFLITO");
  });

  it("POST /produtos-quimicos com nome duplicado retorna 409", async () => {
    await ctx.app.inject({
      method: "POST",
      url: "/produtos-quimicos",
      payload: { nome: "Produto Único XYZ", classeRisco: "3", grupoCompatibilidade: "A" },
    });
    const resposta = await ctx.app.inject({
      method: "POST",
      url: "/produtos-quimicos",
      payload: { nome: "Produto Único XYZ", classeRisco: "3", grupoCompatibilidade: "A" },
    });
    expect(resposta.statusCode).toBe(409);
  });

  it("PUT /produtos-quimicos/:id atualiza dados sem alterar status", async () => {
    const criado = await ctx.app.inject({
      method: "POST",
      url: "/produtos-quimicos",
      payload: { nome: "Produto Para Atualizar", classeRisco: "4", grupoCompatibilidade: "A" },
    });
    const id = criado.json().id;
    const atualizado = await ctx.app.inject({
      method: "PUT",
      url: `/produtos-quimicos/${id}`,
      payload: { nome: "Produto Atualizado", classeRisco: "4", grupoCompatibilidade: "A" },
    });
    expect(atualizado.statusCode).toBe(200);
    expect(atualizado.json().nome).toBe("Produto Atualizado");
    expect(atualizado.json().status).toBe("Ativo");
  });
});
