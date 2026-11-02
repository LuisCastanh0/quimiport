import { describe, expect, it } from "vitest";
import { ProdutoQuimicoBuilder } from "../../../support/builders/ProdutoQuimicoBuilder.js";
import { ProdutoQuimico } from "../../../../src/domain/produto-quimico/ProdutoQuimico.js";
import { StatusProduto } from "../../../../src/domain/produto-quimico/StatusProduto.js";

const AGORA = new Date("2026-01-01T00:00:00.000Z");

describe("ProdutoQuimico", () => {
  it("cadastra produto válido com status Ativo (RN16)", () => {
    const produto = new ProdutoQuimicoBuilder().construir();
    expect(produto.status).toBe(StatusProduto.Ativo);
    expect(produto.podeSerUsadoEmNovaCarga()).toBe(true);
  });

  it("não permite cadastro sem nome (RN08)", () => {
    expect(() =>
      ProdutoQuimico.cadastrar({
        id: "p1",
        nome: "   ",
        classeRisco: "3",
        grupoCompatibilidade: "A",
        agora: AGORA,
      }),
    ).toThrowError(/nome/i);
  });

  it("não permite cadastro sem classe de risco (RN09)", () => {
    expect(() =>
      ProdutoQuimico.cadastrar({
        id: "p1",
        nome: "Produto Teste",
        classeRisco: "",
        grupoCompatibilidade: "A",
        agora: AGORA,
      }),
    ).toThrowError(/classe de risco/i);
  });

  it("rejeita número ONU fora do formato UN+4 dígitos", () => {
    expect(() =>
      ProdutoQuimico.cadastrar({
        id: "p1",
        nome: "Produto Teste",
        numeroOnu: "123",
        classeRisco: "3",
        grupoCompatibilidade: "A",
        agora: AGORA,
      }),
    ).toThrowError(/UN/);
  });

  it("UC02 — inativa produto ativo (RN10)", () => {
    const produto = new ProdutoQuimicoBuilder().construir();
    produto.inativar(AGORA);
    expect(produto.status).toBe(StatusProduto.Inativo);
    expect(produto.podeSerUsadoEmNovaCarga()).toBe(false);
  });

  it("rejeita inativar produto já inativo (409)", () => {
    const produto = new ProdutoQuimicoBuilder().comProdutoInativo().construir();
    expect(() => produto.inativar(AGORA)).toThrowError(/já está inativo/i);
  });
});
