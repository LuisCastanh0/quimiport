import {
  CargaQuimica,
  type HistoricoStatusEntry,
} from "../../../../domain/carga-quimica/CargaQuimica.js";
import { DocumentoCarga, StatusValidacaoDocumento, TipoDocumento } from "../../../../domain/carga-quimica/DocumentoCarga.js";
import { Inspecao, ResultadoInspecao } from "../../../../domain/carga-quimica/Inspecao.js";
import { StatusCarga } from "../../../../domain/carga-quimica/StatusCarga.js";
import type { UnidadeMedida } from "../../../../domain/carga-quimica/value-objects/Quantidade.js";
import type { Prisma } from "../../../../../generated/prisma/client.js";

/** Include usado em toda leitura da carga — mantém o agregado completo em uma única consulta. */
export const INCLUDE_AGREGADO_COMPLETO = {
  documentos: true,
  inspecoes: true,
  historico: { orderBy: { ocorridoEm: "asc" } },
} satisfies Prisma.CargaQuimicaInclude;

export type CargaQuimicaComRelacoes = Prisma.CargaQuimicaGetPayload<{
  include: typeof INCLUDE_AGREGADO_COMPLETO;
}>;

export const CargaQuimicaMapper = {
  paraDominio(row: CargaQuimicaComRelacoes): CargaQuimica {
    const documentos = row.documentos.map((documento) =>
      DocumentoCarga.reconstituir({
        id: documento.id,
        tipo: documento.tipo as TipoDocumento,
        numero: documento.numero,
        periodoValidade: {
          dataEmissao: documento.dataEmissao,
          dataValidade: documento.dataValidade,
        },
        statusValidacao: documento.statusValidacao as StatusValidacaoDocumento,
        createdAt: documento.createdAt,
        updatedAt: documento.updatedAt,
      }),
    );

    const inspecoes = row.inspecoes.map((inspecao) =>
      Inspecao.reconstituir({
        id: inspecao.id,
        dataInspecao: inspecao.dataInspecao,
        inspetorResponsavel: inspecao.inspetorResponsavel,
        resultado: inspecao.resultado as ResultadoInspecao,
        parecer: inspecao.parecer ?? undefined,
        createdAt: inspecao.createdAt,
      }),
    );

    const historicoStatus: HistoricoStatusEntry[] = row.historico.map((item) => ({
      statusAnterior: (item.statusAnterior as StatusCarga | null) ?? null,
      statusNovo: item.statusNovo as StatusCarga,
      motivo: item.motivo ?? undefined,
      ocorridoEm: item.ocorridoEm,
    }));

    return CargaQuimica.reconstituir({
      id: row.id,
      codigo: row.codigo,
      produtoQuimicoId: row.produtoQuimicoId,
      quantidade: { valor: Number(row.quantidadeValor), unidadeMedida: row.unidadeMedida as UnidadeMedida },
      classeRisco: row.classeRisco,
      origem: row.origem,
      destino: row.destino,
      responsavelTecnicoId: row.responsavelTecnicoId,
      dataEntrada: row.dataEntrada,
      status: row.status as StatusCarga,
      aceiteResponsavelTecnico: row.aceiteResponsavelTecnicoEm ?? undefined,
      documentos,
      inspecoes,
      historicoStatus,
      version: row.version,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  },

  linhaPrincipal(carga: CargaQuimica) {
    return {
      codigo: carga.codigo,
      produtoQuimicoId: carga.produtoQuimicoId,
      quantidadeValor: carga.quantidade.valor,
      unidadeMedida: carga.quantidade.unidadeMedida,
      origem: carga.origem,
      destino: carga.destino,
      responsavelTecnicoId: carga.responsavelTecnicoId,
      classeRisco: carga.classificacaoRisco.classeRisco,
      status: carga.status,
      aceiteResponsavelTecnicoEm: carga.aceiteResponsavelTecnico ?? null,
      dataEntrada: carga.dataEntrada,
    };
  },

  linhaDocumento(documento: DocumentoCarga) {
    return {
      tipo: documento.tipo,
      numero: documento.numero,
      dataEmissao: documento.periodoValidade.dataEmissao,
      dataValidade: documento.periodoValidade.dataValidade,
      statusValidacao: documento.statusValidacao,
    };
  },

  linhaInspecao(inspecao: Inspecao) {
    return {
      dataInspecao: inspecao.dataInspecao,
      inspetorResponsavel: inspecao.inspetorResponsavel,
      resultado: inspecao.resultado,
      parecer: inspecao.parecer ?? null,
    };
  },
};
