import { beforeEach, describe, expect, it } from "vitest";
import { CadastrarProdutoQuimico } from "../../../src/application/use-cases/produto-quimico/CadastrarProdutoQuimico.js";
import { InativarProdutoQuimico } from "../../../src/application/use-cases/produto-quimico/InativarProdutoQuimico.js";
import { AtualizarProdutoQuimico } from "../../../src/application/use-cases/produto-quimico/AtualizarProdutoQuimico.js";
import { ListarProdutosQuimicos } from "../../../src/application/use-cases/produto-quimico/ListarProdutosQuimicos.js";
import { BuscarProdutoQuimicoPorId } from "../../../src/application/use-cases/produto-quimico/BuscarProdutoQuimicoPorId.js";
import { InMemoryProdutoQuimicoRepository } from "../../../src/infrastructure/persistence/in-memory/InMemoryProdutoQuimicoRepository.js";
import { StatusProduto } from "../../../src/domain/produto-quimico/StatusProduto.js";
import { FakeClock } from "../../support/FakeClock.js";
import { FakeIdGenerator } from "../../support/FakeIdGenerator.js";
import { FakeLogger } from "../../support/FakeLogger.js";

describe("Casos de uso — Produto Químico", () => {
  let repositorio: InMemoryProdutoQuimicoRepository;
  let clock: FakeClock;
  let idGenerator: FakeIdGenerator;
  let logger: FakeLogger;

  beforeEach(() => {
    repositorio = new InMemoryProdutoQuimicoRepository();
    clock = new FakeClock();
    idGenerator = new FakeIdGenerator();
    logger = new FakeLogger();
  });

  it("UC01 — cadastra produto químico e persiste", async () => {
    const useCase = new CadastrarProdutoQuimico(repositorio, clock, idGenerator, logger);
    const { produto } = await useCase.executar({
      nome: "Hidróxido de Sódio",
      classeRisco: "8",
      grupoCompatibilidade: "A",
    });
    expect(produto.status).toBe(StatusProduto.Ativo);
    await expect(repositorio.buscarPorId(produto.id)).resolves.toBe(produto);
    expect(logger.registros.some((log) => log.mensagem === "produto.criado")).toBe(true);
  });

  it("UC01 — rejeita nome duplicado (409)", async () => {
    const useCase = new CadastrarProdutoQuimico(repositorio, clock, idGenerator, logger);
    await useCase.executar({ nome: "Acetona", classeRisco: "3", grupoCompatibilidade: "A" });
    await expect(
      useCase.executar({ nome: "Acetona", classeRisco: "3", grupoCompatibilidade: "A" }),
    ).rejects.toMatchObject({ codigo: "CONFLITO" });
  });

  it("UC02 — inativa produto ativo", async () => {
    const cadastrar = new CadastrarProdutoQuimico(repositorio, clock, idGenerator, logger);
    const { produto } = await cadastrar.executar({
      nome: "Amônia",
      classeRisco: "2",
      grupoCompatibilidade: "B",
    });
    const inativar = new InativarProdutoQuimico(repositorio, clock, logger);
    const { produto: inativado } = await inativar.executar({ produtoId: produto.id });
    expect(inativado.status).toBe(StatusProduto.Inativo);
  });

  it("UC02 — 404 ao inativar produto inexistente", async () => {
    const inativar = new InativarProdutoQuimico(repositorio, clock, logger);
    await expect(inativar.executar({ produtoId: "inexistente" })).rejects.toMatchObject({
      codigo: "NAO_ENCONTRADO",
    });
  });

  it("atualiza dados de um produto existente", async () => {
    const cadastrar = new CadastrarProdutoQuimico(repositorio, clock, idGenerator, logger);
    const { produto } = await cadastrar.executar({
      nome: "Metanol",
      classeRisco: "3",
      grupoCompatibilidade: "A",
    });
    const atualizar = new AtualizarProdutoQuimico(repositorio, clock, logger);
    const { produto: atualizado } = await atualizar.executar({
      produtoId: produto.id,
      nome: "Metanol P.A.",
      classeRisco: "3",
      grupoCompatibilidade: "A",
    });
    expect(atualizado.nome).toBe("Metanol P.A.");
  });

  it("lista e busca produtos cadastrados", async () => {
    const cadastrar = new CadastrarProdutoQuimico(repositorio, clock, idGenerator, logger);
    const { produto } = await cadastrar.executar({
      nome: "Tolueno",
      classeRisco: "3",
      grupoCompatibilidade: "A",
    });

    const listar = new ListarProdutosQuimicos(repositorio);
    const resultado = await listar.executar({});
    expect(resultado.total).toBe(1);

    const buscar = new BuscarProdutoQuimicoPorId(repositorio);
    const encontrado = await buscar.executar({ produtoId: produto.id });
    expect(encontrado.produto.id).toBe(produto.id);
  });
});
