import { AdicionarDocumentoCarga } from "./application/use-cases/carga-quimica/AdicionarDocumentoCarga.js";
import { AssumirResponsabilidadeTecnica } from "./application/use-cases/carga-quimica/AssumirResponsabilidadeTecnica.js";
import { AtualizarStatusCarga } from "./application/use-cases/carga-quimica/AtualizarStatusCarga.js";
import { BloquearCargaQuimica } from "./application/use-cases/carga-quimica/BloquearCargaQuimica.js";
import { BuscarCargaQuimicaPorId } from "./application/use-cases/carga-quimica/BuscarCargaQuimicaPorId.js";
import { CancelarCargaQuimica } from "./application/use-cases/carga-quimica/CancelarCargaQuimica.js";
import { LiberarCargaQuimica } from "./application/use-cases/carga-quimica/LiberarCargaQuimica.js";
import { ListarCargasQuimicas } from "./application/use-cases/carga-quimica/ListarCargasQuimicas.js";
import { ObterHistoricoCarga } from "./application/use-cases/carga-quimica/ObterHistoricoCarga.js";
import { RegistrarCargaQuimica } from "./application/use-cases/carga-quimica/RegistrarCargaQuimica.js";
import { RegistrarInspecaoCarga } from "./application/use-cases/carga-quimica/RegistrarInspecaoCarga.js";
import { ValidarDocumentoCarga } from "./application/use-cases/carga-quimica/ValidarDocumentoCarga.js";
import { AtualizarProdutoQuimico } from "./application/use-cases/produto-quimico/AtualizarProdutoQuimico.js";
import { BuscarProdutoQuimicoPorId } from "./application/use-cases/produto-quimico/BuscarProdutoQuimicoPorId.js";
import { CadastrarProdutoQuimico } from "./application/use-cases/produto-quimico/CadastrarProdutoQuimico.js";
import { InativarProdutoQuimico } from "./application/use-cases/produto-quimico/InativarProdutoQuimico.js";
import { ListarProdutosQuimicos } from "./application/use-cases/produto-quimico/ListarProdutosQuimicos.js";
import { BuscarResponsavelTecnicoPorId } from "./application/use-cases/responsavel-tecnico/BuscarResponsavelTecnicoPorId.js";
import { CadastrarResponsavelTecnico } from "./application/use-cases/responsavel-tecnico/CadastrarResponsavelTecnico.js";
import { ListarResponsaveisTecnicos } from "./application/use-cases/responsavel-tecnico/ListarResponsaveisTecnicos.js";
import type { IClock } from "./application/ports/IClock.js";
import type { IIdGenerator } from "./application/ports/IIdGenerator.js";
import type { ILogger } from "./application/ports/ILogger.js";
import type { ICargaQuimicaRepository } from "./domain/carga-quimica/ICargaQuimicaRepository.js";
import type { IProdutoQuimicoRepository } from "./domain/produto-quimico/IProdutoQuimicoRepository.js";
import type { IResponsavelTecnicoRepository } from "./domain/responsavel-tecnico/IResponsavelTecnicoRepository.js";

export interface ContainerDeps {
  readonly produtoRepo: IProdutoQuimicoRepository;
  readonly rtRepo: IResponsavelTecnicoRepository;
  readonly cargaRepo: ICargaQuimicaRepository;
  readonly clock: IClock;
  readonly idGenerator: IIdGenerator;
  readonly logger: ILogger;
  /** Usado por `/health` para verificar conectividade com o banco. */
  readonly pingBancoDados: () => Promise<boolean>;
}

/**
 * Composição manual (ADR: sem container de DI) — cada caso de uso recebe
 * exatamente as dependências que precisa (ADR-08).
 */
export function criarContainer(deps: ContainerDeps) {
  const { produtoRepo, rtRepo, cargaRepo, clock, idGenerator, logger } = deps;

  return {
    ...deps,
    useCases: {
      cadastrarProdutoQuimico: new CadastrarProdutoQuimico(produtoRepo, clock, idGenerator, logger),
      inativarProdutoQuimico: new InativarProdutoQuimico(produtoRepo, clock, logger),
      atualizarProdutoQuimico: new AtualizarProdutoQuimico(produtoRepo, clock, logger),
      listarProdutosQuimicos: new ListarProdutosQuimicos(produtoRepo),
      buscarProdutoQuimicoPorId: new BuscarProdutoQuimicoPorId(produtoRepo),

      cadastrarResponsavelTecnico: new CadastrarResponsavelTecnico(rtRepo, clock, idGenerator, logger),
      listarResponsaveisTecnicos: new ListarResponsaveisTecnicos(rtRepo),
      buscarResponsavelTecnicoPorId: new BuscarResponsavelTecnicoPorId(rtRepo),

      registrarCargaQuimica: new RegistrarCargaQuimica(
        cargaRepo,
        produtoRepo,
        rtRepo,
        clock,
        idGenerator,
        logger,
      ),
      listarCargasQuimicas: new ListarCargasQuimicas(cargaRepo),
      buscarCargaQuimicaPorId: new BuscarCargaQuimicaPorId(cargaRepo),
      atualizarStatusCarga: new AtualizarStatusCarga(cargaRepo, clock, logger),
      liberarCargaQuimica: new LiberarCargaQuimica(cargaRepo, clock, logger),
      bloquearCargaQuimica: new BloquearCargaQuimica(cargaRepo, clock, logger),
      cancelarCargaQuimica: new CancelarCargaQuimica(cargaRepo, clock, logger),
      adicionarDocumentoCarga: new AdicionarDocumentoCarga(cargaRepo, clock, idGenerator, logger),
      validarDocumentoCarga: new ValidarDocumentoCarga(cargaRepo, clock, logger),
      registrarInspecaoCarga: new RegistrarInspecaoCarga(cargaRepo, clock, idGenerator, logger),
      assumirResponsabilidadeTecnica: new AssumirResponsabilidadeTecnica(cargaRepo, clock, logger),
      obterHistoricoCarga: new ObterHistoricoCarga(cargaRepo),
    },
  };
}

export type Container = ReturnType<typeof criarContainer>;
