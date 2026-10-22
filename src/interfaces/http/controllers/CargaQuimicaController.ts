import type { Container } from "../../../container.js";
import type { CargaQuimica } from "../../../domain/carga-quimica/CargaQuimica.js";
import type { DocumentoCarga, TipoDocumento } from "../../../domain/carga-quimica/DocumentoCarga.js";
import type { StatusValidacaoDocumento } from "../../../domain/carga-quimica/DocumentoCarga.js";
import type { Inspecao, ResultadoInspecao } from "../../../domain/carga-quimica/Inspecao.js";
import type { StatusCarga } from "../../../domain/carga-quimica/StatusCarga.js";
import type { ListarCargasQuimicasInput } from "../../../application/use-cases/carga-quimica/ListarCargasQuimicas.js";

function paraRespostaDocumento(documento: DocumentoCarga) {
  return {
    id: documento.id,
    tipo: documento.tipo,
    numero: documento.numero,
    dataEmissao: documento.periodoValidade.dataEmissao.toISOString(),
    dataValidade: documento.periodoValidade.dataValidade.toISOString(),
    statusValidacao: documento.statusValidacao,
  };
}

function paraRespostaInspecao(inspecao: Inspecao) {
  return {
    id: inspecao.id,
    dataInspecao: inspecao.dataInspecao.toISOString(),
    inspetorResponsavel: inspecao.inspetorResponsavel,
    resultado: inspecao.resultado,
    parecer: inspecao.parecer ?? null,
  };
}

export function paraRespostaCargaQuimica(carga: CargaQuimica, incluirRelacoes = true) {
  return {
    id: carga.id,
    codigo: carga.codigo,
    produtoQuimicoId: carga.produtoQuimicoId,
    quantidade: { valor: carga.quantidade.valor, unidadeMedida: carga.quantidade.unidadeMedida },
    classeRisco: carga.classificacaoRisco.classeRisco,
    origem: carga.origem,
    destino: carga.destino,
    responsavelTecnicoId: carga.responsavelTecnicoId,
    status: carga.status,
    aceiteResponsavelTecnico: carga.aceiteResponsavelTecnico?.toISOString() ?? null,
    dataEntrada: carga.dataEntrada.toISOString(),
    ...(incluirRelacoes
      ? {
          documentos: carga.documentos.map(paraRespostaDocumento),
          inspecoes: carga.inspecoes.map(paraRespostaInspecao),
        }
      : {}),
  };
}

export const CargaQuimicaController = {
  async registrar(
    container: Container,
    body: {
      produtoQuimicoId: string;
      quantidade: { valor: number; unidadeMedida: "kg" | "L" | "ton" };
      origem: string;
      destino: string;
      responsavelTecnicoId: string;
      codigo?: string;
      classeRisco?: string;
      dataEntrada?: string;
      documentos?: ReadonlyArray<{
        tipo: TipoDocumento;
        numero: string;
        dataEmissao: string;
        dataValidade: string;
      }>;
    },
  ) {
    const { carga } = await container.useCases.registrarCargaQuimica.executar(body);
    return paraRespostaCargaQuimica(carga);
  },

  async listar(container: Container, query: ListarCargasQuimicasInput) {
    const resultado = await container.useCases.listarCargasQuimicas.executar(query);
    return {
      data: resultado.dados.map((carga) => paraRespostaCargaQuimica(carga, false)),
      meta: { page: resultado.pagina, limit: resultado.limite, total: resultado.total },
    };
  },

  async buscarPorId(container: Container, cargaId: string) {
    const { carga } = await container.useCases.buscarCargaQuimicaPorId.executar({ cargaId });
    return paraRespostaCargaQuimica(carga);
  },

  async atualizarStatus(container: Container, cargaId: string, status: StatusCarga, motivo?: string) {
    const { carga } = await container.useCases.atualizarStatusCarga.executar({ cargaId, status, motivo });
    return paraRespostaCargaQuimica(carga);
  },

  async liberar(container: Container, cargaId: string) {
    const { carga } = await container.useCases.liberarCargaQuimica.executar({ cargaId });
    return paraRespostaCargaQuimica(carga);
  },

  async bloquear(container: Container, cargaId: string, motivo: string) {
    const { carga } = await container.useCases.bloquearCargaQuimica.executar({ cargaId, motivo });
    return paraRespostaCargaQuimica(carga);
  },

  async cancelar(container: Container, cargaId: string, motivo: string) {
    const { carga } = await container.useCases.cancelarCargaQuimica.executar({ cargaId, motivo });
    return paraRespostaCargaQuimica(carga);
  },

  async adicionarDocumento(
    container: Container,
    cargaId: string,
    body: { tipo: TipoDocumento; numero: string; dataEmissao: string; dataValidade: string },
  ) {
    const { documento } = await container.useCases.adicionarDocumentoCarga.executar({
      cargaId,
      ...body,
    });
    return paraRespostaDocumento(documento);
  },

  async validarDocumento(
    container: Container,
    cargaId: string,
    documentoId: string,
    status: StatusValidacaoDocumento,
  ) {
    const { documento } = await container.useCases.validarDocumentoCarga.executar({
      cargaId,
      documentoId,
      status,
    });
    return paraRespostaDocumento(documento);
  },

  async registrarInspecao(
    container: Container,
    cargaId: string,
    body: {
      dataInspecao: string;
      inspetorResponsavel: string;
      resultado: ResultadoInspecao;
      parecer?: string;
    },
  ) {
    const { inspecao } = await container.useCases.registrarInspecaoCarga.executar({
      cargaId,
      ...body,
    });
    return paraRespostaInspecao(inspecao);
  },

  async assumirResponsabilidadeTecnica(
    container: Container,
    cargaId: string,
    responsavelTecnicoId: string,
  ) {
    const { carga } = await container.useCases.assumirResponsabilidadeTecnica.executar({
      cargaId,
      responsavelTecnicoId,
    });
    return paraRespostaCargaQuimica(carga);
  },

  async obterHistorico(container: Container, cargaId: string) {
    const { historico } = await container.useCases.obterHistoricoCarga.executar({ cargaId });
    return {
      data: historico.map((entrada) => ({
        statusAnterior: entrada.statusAnterior,
        statusNovo: entrada.statusNovo,
        motivo: entrada.motivo ?? null,
        ocorridoEm: entrada.ocorridoEm.toISOString(),
      })),
    };
  },
};
