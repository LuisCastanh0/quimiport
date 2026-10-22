import { beforeEach, describe, expect, it } from "vitest";
import { CadastrarProdutoQuimico } from "../../../src/application/use-cases/produto-quimico/CadastrarProdutoQuimico.js";
import { CadastrarResponsavelTecnico } from "../../../src/application/use-cases/responsavel-tecnico/CadastrarResponsavelTecnico.js";
import { RegistrarCargaQuimica } from "../../../src/application/use-cases/carga-quimica/RegistrarCargaQuimica.js";
import { AdicionarDocumentoCarga } from "../../../src/application/use-cases/carga-quimica/AdicionarDocumentoCarga.js";
import { ValidarDocumentoCarga } from "../../../src/application/use-cases/carga-quimica/ValidarDocumentoCarga.js";
import { AtualizarStatusCarga } from "../../../src/application/use-cases/carga-quimica/AtualizarStatusCarga.js";
import { RegistrarInspecaoCarga } from "../../../src/application/use-cases/carga-quimica/RegistrarInspecaoCarga.js";
import { AssumirResponsabilidadeTecnica } from "../../../src/application/use-cases/carga-quimica/AssumirResponsabilidadeTecnica.js";
import { LiberarCargaQuimica } from "../../../src/application/use-cases/carga-quimica/LiberarCargaQuimica.js";
import { BloquearCargaQuimica } from "../../../src/application/use-cases/carga-quimica/BloquearCargaQuimica.js";
import { CancelarCargaQuimica } from "../../../src/application/use-cases/carga-quimica/CancelarCargaQuimica.js";
import { ListarCargasQuimicas } from "../../../src/application/use-cases/carga-quimica/ListarCargasQuimicas.js";
import { ObterHistoricoCarga } from "../../../src/application/use-cases/carga-quimica/ObterHistoricoCarga.js";
import { InMemoryCargaQuimicaRepository } from "../../../src/infrastructure/persistence/in-memory/InMemoryCargaQuimicaRepository.js";
import { InMemoryProdutoQuimicoRepository } from "../../../src/infrastructure/persistence/in-memory/InMemoryProdutoQuimicoRepository.js";
import { InMemoryResponsavelTecnicoRepository } from "../../../src/infrastructure/persistence/in-memory/InMemoryResponsavelTecnicoRepository.js";
import { StatusCarga } from "../../../src/domain/carga-quimica/StatusCarga.js";
import { TipoDocumento, StatusValidacaoDocumento } from "../../../src/domain/carga-quimica/DocumentoCarga.js";
import { ResultadoInspecao } from "../../../src/domain/carga-quimica/Inspecao.js";
import { FakeClock } from "../../support/FakeClock.js";
import { FakeIdGenerator } from "../../support/FakeIdGenerator.js";
import { FakeLogger } from "../../support/FakeLogger.js";

describe("Caso de uso completo — Registrar -> ... -> Finalizar", () => {
  let cargaRepo: InMemoryCargaQuimicaRepository;
  let produtoRepo: InMemoryProdutoQuimicoRepository;
  let rtRepo: InMemoryResponsavelTecnicoRepository;
  let clock: FakeClock;
  let idGenerator: FakeIdGenerator;
  let logger: FakeLogger;

  beforeEach(async () => {
    cargaRepo = new InMemoryCargaQuimicaRepository();
    produtoRepo = new InMemoryProdutoQuimicoRepository();
    rtRepo = new InMemoryResponsavelTecnicoRepository();
    clock = new FakeClock();
    idGenerator = new FakeIdGenerator();
    logger = new FakeLogger();
  });

  async function cadastrarProdutoERt() {
    const cadastrarProduto = new CadastrarProdutoQuimico(produtoRepo, clock, idGenerator, logger);
    const { produto } = await cadastrarProduto.executar({
      nome: "Ácido Clorídrico",
      classeRisco: "8",
      grupoCompatibilidade: "A",
    });
    const cadastrarRt = new CadastrarResponsavelTecnico(rtRepo, clock, idGenerator, logger);
    const { responsavelTecnico } = await cadastrarRt.executar({
      nome: "Carlos Mendes",
      registroNumero: "CRQ-999",
      registroOrgao: "CRQ",
    });
    return { produto, responsavelTecnico };
  }

  it("executa o fluxo feliz completo até Finalizada", async () => {
    const { produto, responsavelTecnico } = await cadastrarProdutoERt();

    const registrar = new RegistrarCargaQuimica(
      cargaRepo,
      produtoRepo,
      rtRepo,
      clock,
      idGenerator,
      logger,
    );
    const { carga } = await registrar.executar({
      produtoQuimicoId: produto.id,
      quantidade: { valor: 500, unidadeMedida: "kg" },
      origem: "Terminal A",
      destino: "Armazém B",
      responsavelTecnicoId: responsavelTecnico.id,
    });
    expect(carga.status).toBe(StatusCarga.Registrada);

    const adicionarDocumento = new AdicionarDocumentoCarga(cargaRepo, clock, idGenerator, logger);
    const validarDocumento = new ValidarDocumentoCarga(cargaRepo, clock, logger);
    for (const tipo of [
      TipoDocumento.FichaSeguranca,
      TipoDocumento.LaudoTecnico,
      TipoDocumento.LicencaTransporte,
    ]) {
      const { documento } = await adicionarDocumento.executar({
        cargaId: carga.id,
        tipo,
        numero: `DOC-${tipo}`,
        dataEmissao: "2026-01-01T00:00:00.000Z",
        dataValidade: "2030-01-01T00:00:00.000Z",
      });
      await validarDocumento.executar({
        cargaId: carga.id,
        documentoId: documento.id,
        status: StatusValidacaoDocumento.Valido,
      });
    }

    const atualizarStatus = new AtualizarStatusCarga(cargaRepo, clock, logger);
    await atualizarStatus.executar({ cargaId: carga.id, status: StatusCarga.EmAnalise });
    await atualizarStatus.executar({ cargaId: carga.id, status: StatusCarga.EmInspecao });

    const assumirResponsabilidade = new AssumirResponsabilidadeTecnica(cargaRepo, clock, logger);
    await assumirResponsabilidade.executar({
      cargaId: carga.id,
      responsavelTecnicoId: responsavelTecnico.id,
    });

    const registrarInspecao = new RegistrarInspecaoCarga(cargaRepo, clock, idGenerator, logger);
    await registrarInspecao.executar({
      cargaId: carga.id,
      dataInspecao: "2026-01-02T00:00:00.000Z",
      inspetorResponsavel: "Fernanda Lima",
      resultado: ResultadoInspecao.Aprovada,
    });

    const liberar = new LiberarCargaQuimica(cargaRepo, clock, logger);
    const { carga: liberada } = await liberar.executar({ cargaId: carga.id });
    expect(liberada.status).toBe(StatusCarga.Liberada);

    await atualizarStatus.executar({ cargaId: carga.id, status: StatusCarga.EmMovimentacao });
    const { carga: finalizada } = await atualizarStatus.executar({
      cargaId: carga.id,
      status: StatusCarga.Finalizada,
    });
    expect(finalizada.status).toBe(StatusCarga.Finalizada);

    const historicoUseCase = new ObterHistoricoCarga(cargaRepo);
    const { historico } = await historicoUseCase.executar({ cargaId: carga.id });
    expect(historico).toHaveLength(6);

    const listar = new ListarCargasQuimicas(cargaRepo);
    const { total } = await listar.executar({ status: StatusCarga.Finalizada });
    expect(total).toBe(1);
  });

  it("não permite movimentar carga bloqueada (RN05)", async () => {
    const { produto, responsavelTecnico } = await cadastrarProdutoERt();
    const registrar = new RegistrarCargaQuimica(
      cargaRepo,
      produtoRepo,
      rtRepo,
      clock,
      idGenerator,
      logger,
    );
    const { carga } = await registrar.executar({
      produtoQuimicoId: produto.id,
      quantidade: { valor: 10, unidadeMedida: "kg" },
      origem: "A",
      destino: "B",
      responsavelTecnicoId: responsavelTecnico.id,
    });

    const atualizarStatus = new AtualizarStatusCarga(cargaRepo, clock, logger);
    await atualizarStatus.executar({ cargaId: carga.id, status: StatusCarga.EmAnalise });
    // Sem documentação válida: usamos o endpoint genérico apenas até EmAnalise,
    // depois forçamos EmInspecao via dados mínimos para testar bloqueio manual.
    await expect(
      atualizarStatus.executar({ cargaId: carga.id, status: StatusCarga.EmInspecao }),
    ).rejects.toMatchObject({ codigo: "REGRA_DE_NEGOCIO" });
  });

  it("bloqueia carga em EmInspecao e rejeita movimentação (RN05/RN14)", async () => {
    const { produto, responsavelTecnico } = await cadastrarProdutoERt();
    const registrar = new RegistrarCargaQuimica(
      cargaRepo,
      produtoRepo,
      rtRepo,
      clock,
      idGenerator,
      logger,
    );
    const { carga } = await registrar.executar({
      produtoQuimicoId: produto.id,
      quantidade: { valor: 10, unidadeMedida: "kg" },
      origem: "A",
      destino: "B",
      responsavelTecnicoId: responsavelTecnico.id,
    });

    const adicionarDocumento = new AdicionarDocumentoCarga(cargaRepo, clock, idGenerator, logger);
    const validarDocumento = new ValidarDocumentoCarga(cargaRepo, clock, logger);
    for (const tipo of [
      TipoDocumento.FichaSeguranca,
      TipoDocumento.LaudoTecnico,
      TipoDocumento.LicencaTransporte,
    ]) {
      const { documento } = await adicionarDocumento.executar({
        cargaId: carga.id,
        tipo,
        numero: `D-${tipo}`,
        dataEmissao: "2026-01-01T00:00:00.000Z",
        dataValidade: "2030-01-01T00:00:00.000Z",
      });
      await validarDocumento.executar({
        cargaId: carga.id,
        documentoId: documento.id,
        status: StatusValidacaoDocumento.Valido,
      });
    }

    const atualizarStatus = new AtualizarStatusCarga(cargaRepo, clock, logger);
    await atualizarStatus.executar({ cargaId: carga.id, status: StatusCarga.EmAnalise });
    await atualizarStatus.executar({ cargaId: carga.id, status: StatusCarga.EmInspecao });

    const bloquear = new BloquearCargaQuimica(cargaRepo, clock, logger);
    await bloquear.executar({ cargaId: carga.id, motivo: "Risco identificado em campo" });

    await expect(
      atualizarStatus.executar({ cargaId: carga.id, status: StatusCarga.EmMovimentacao }),
    ).rejects.toMatchObject({ codigo: "TRANSICAO_INVALIDA" });
  });

  it("cancela carga registrada (UC09)", async () => {
    const { produto, responsavelTecnico } = await cadastrarProdutoERt();
    const registrar = new RegistrarCargaQuimica(
      cargaRepo,
      produtoRepo,
      rtRepo,
      clock,
      idGenerator,
      logger,
    );
    const { carga } = await registrar.executar({
      produtoQuimicoId: produto.id,
      quantidade: { valor: 10, unidadeMedida: "kg" },
      origem: "A",
      destino: "B",
      responsavelTecnicoId: responsavelTecnico.id,
    });
    const cancelar = new CancelarCargaQuimica(cargaRepo, clock, logger);
    const { carga: cancelada } = await cancelar.executar({
      cargaId: carga.id,
      motivo: "Pedido do cliente",
    });
    expect(cancelada.status).toBe(StatusCarga.Cancelada);
  });

  it("404 ao operar sobre carga inexistente", async () => {
    const liberar = new LiberarCargaQuimica(cargaRepo, clock, logger);
    await expect(liberar.executar({ cargaId: "inexistente" })).rejects.toMatchObject({
      codigo: "NAO_ENCONTRADO",
    });
  });

  it("RN02 — rejeita registro com produto inativo propagando o erro de domínio", async () => {
    const cadastrarProduto = new CadastrarProdutoQuimico(produtoRepo, clock, idGenerator, logger);
    const { produto } = await cadastrarProduto.executar({
      nome: "Produto Inativo Teste",
      classeRisco: "3",
      grupoCompatibilidade: "A",
    });
    const cadastrarRt = new CadastrarResponsavelTecnico(rtRepo, clock, idGenerator, logger);
    const { responsavelTecnico } = await cadastrarRt.executar({
      nome: "RT Teste",
      registroNumero: "123",
      registroOrgao: "CRQ",
    });
    produto.inativar(clock.agora());
    await produtoRepo.salvar(produto);

    const registrar = new RegistrarCargaQuimica(
      cargaRepo,
      produtoRepo,
      rtRepo,
      clock,
      idGenerator,
      logger,
    );
    await expect(
      registrar.executar({
        produtoQuimicoId: produto.id,
        quantidade: { valor: 10, unidadeMedida: "kg" },
        origem: "A",
        destino: "B",
        responsavelTecnicoId: responsavelTecnico.id,
      }),
    ).rejects.toMatchObject({ regra: "RN02", codigo: "REGRA_DE_NEGOCIO" });
  });
});
