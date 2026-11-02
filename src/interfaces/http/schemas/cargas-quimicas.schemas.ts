import { z } from "zod";
import { TipoDocumento, StatusValidacaoDocumento } from "../../../domain/carga-quimica/DocumentoCarga.js";
import { ResultadoInspecao } from "../../../domain/carga-quimica/Inspecao.js";
import { StatusCarga } from "../../../domain/carga-quimica/StatusCarga.js";
import { paginaMetaSchema } from "./common.schemas.js";
import { ClasseRiscoSchema } from "./produtos-quimicos.schemas.js";

export const UnidadeMedidaSchema = z.enum(["kg", "L", "ton"]);

const DOCUMENTO_EXEMPLO = {
  id: "44444444-4444-4444-4444-444444444444",
  tipo: TipoDocumento.FichaSeguranca,
  numero: "FS-2026-0001",
  dataEmissao: "2026-01-01T00:00:00.000Z",
  dataValidade: "2030-01-01T00:00:00.000Z",
  statusValidacao: StatusValidacaoDocumento.Valido,
};

const INSPECAO_EXEMPLO = {
  id: "55555555-5555-5555-5555-555555555555",
  dataInspecao: "2026-01-02T00:00:00.000Z",
  inspetorResponsavel: "Fernanda Lima",
  resultado: ResultadoInspecao.Aprovada,
  parecer: "Embalagem e rotulagem conformes.",
};

const CARGA_QUIMICA_EXEMPLO = {
  id: "33333333-3333-3333-3333-333333333333",
  codigo: "CQ-2026-0001",
  produtoQuimicoId: "11111111-1111-1111-1111-111111111111",
  quantidade: { valor: 1500, unidadeMedida: "kg" },
  classeRisco: "8",
  origem: "Píer 1 — Porto de Santos",
  destino: "Armazém Central",
  responsavelTecnicoId: "22222222-2222-2222-2222-222222222222",
  status: StatusCarga.EmInspecao,
  aceiteResponsavelTecnico: "2026-01-02T10:00:00.000Z",
  dataEntrada: "2026-01-01T08:00:00.000Z",
  documentos: [DOCUMENTO_EXEMPLO],
  inspecoes: [INSPECAO_EXEMPLO],
};

export const DocumentoCargaRespostaSchema = z
  .object({
    id: z.guid(),
    tipo: z.enum(TipoDocumento),
    numero: z.string(),
    dataEmissao: z.string(),
    dataValidade: z.string(),
    statusValidacao: z.enum(StatusValidacaoDocumento),
  })
  .meta({ example: DOCUMENTO_EXEMPLO });

export const InspecaoRespostaSchema = z
  .object({
    id: z.guid(),
    dataInspecao: z.string(),
    inspetorResponsavel: z.string(),
    resultado: z.enum(ResultadoInspecao),
    parecer: z.string().nullable(),
  })
  .meta({ example: INSPECAO_EXEMPLO });

export const HistoricoStatusRespostaSchema = z.object({
  statusAnterior: z.enum(StatusCarga).nullable(),
  statusNovo: z.enum(StatusCarga),
  motivo: z.string().nullable(),
  ocorridoEm: z.string(),
});

export const CargaQuimicaRespostaSchema = z
  .object({
    id: z.guid(),
    codigo: z.string(),
    produtoQuimicoId: z.guid(),
    quantidade: z.object({ valor: z.number(), unidadeMedida: UnidadeMedidaSchema }),
    classeRisco: z.string(),
    origem: z.string(),
    destino: z.string(),
    responsavelTecnicoId: z.guid(),
    status: z.enum(StatusCarga),
    aceiteResponsavelTecnico: z.string().nullable(),
    dataEntrada: z.string(),
    documentos: z.array(DocumentoCargaRespostaSchema).optional(),
    inspecoes: z.array(InspecaoRespostaSchema).optional(),
  })
  .meta({ example: CARGA_QUIMICA_EXEMPLO });

const DocumentoInicialSchema = z.object({
  tipo: z.enum(TipoDocumento),
  numero: z.string().min(1),
  dataEmissao: z.iso.datetime(),
  dataValidade: z.iso.datetime(),
});

export const RegistrarCargaQuimicaBodySchema = z
  .object({
    produtoQuimicoId: z.guid().meta({ example: "11111111-1111-1111-1111-111111111111" }),
    quantidade: z.object({
      valor: z.number().positive().meta({ example: 1500 }),
      unidadeMedida: UnidadeMedidaSchema.meta({ example: "kg" }),
    }),
    origem: z.string().min(1).meta({ example: "Píer 1 — Porto de Santos" }),
    destino: z.string().min(1).meta({ example: "Armazém Central" }),
    responsavelTecnicoId: z.guid().meta({ example: "22222222-2222-2222-2222-222222222222" }),
    codigo: z.string().min(1).optional(),
    classeRisco: ClasseRiscoSchema.optional(),
    dataEntrada: z.iso.datetime().optional(),
    documentos: z.array(DocumentoInicialSchema).optional(),
  })
  .meta({ id: "RegistrarCargaQuimicaBody" });

export const ListarCargasQuimicasQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(StatusCarga).optional(),
  produtoQuimicoId: z.guid().optional(),
});

export const ListarCargasQuimicasRespostaSchema = z
  .object({
    data: z.array(CargaQuimicaRespostaSchema),
    meta: paginaMetaSchema(),
  })
  .meta({
    example: { data: [CARGA_QUIMICA_EXEMPLO], meta: { page: 1, limit: 20, total: 1 } },
  });

export const AtualizarStatusCargaBodySchema = z
  .object({
    status: z.enum(StatusCarga).meta({ example: "EmAnalise" }),
    motivo: z.string().optional().meta({ example: "Documentação incompleta" }),
  })
  .meta({ id: "AtualizarStatusCargaBody" });

export const BloquearCargaQuimicaBodySchema = z
  .object({ motivo: z.string().min(1).meta({ example: "Inspeção reprovada" }) })
  .meta({ id: "BloquearCargaQuimicaBody" });

export const CancelarCargaQuimicaBodySchema = z
  .object({ motivo: z.string().min(1).meta({ example: "Pedido do cliente" }) })
  .meta({ id: "CancelarCargaQuimicaBody" });

export const AdicionarDocumentoCargaBodySchema = z
  .object({
    tipo: z.enum(TipoDocumento).meta({ example: "FichaSeguranca" }),
    numero: z.string().min(1).meta({ example: "FS-2026-0001" }),
    dataEmissao: z.iso.datetime().meta({ example: "2026-01-01T00:00:00.000Z" }),
    dataValidade: z.iso.datetime().meta({ example: "2030-01-01T00:00:00.000Z" }),
  })
  .meta({ id: "AdicionarDocumentoCargaBody" });

export const ValidarDocumentoCargaBodySchema = z
  .object({
    status: z
      .enum([StatusValidacaoDocumento.Valido, StatusValidacaoDocumento.Invalido])
      .meta({ example: StatusValidacaoDocumento.Valido }),
  })
  .meta({ id: "ValidarDocumentoCargaBody" });

export const RegistrarInspecaoCargaBodySchema = z
  .object({
    dataInspecao: z.iso.datetime().meta({ example: "2026-01-02T00:00:00.000Z" }),
    inspetorResponsavel: z.string().min(1).meta({ example: "Fernanda Lima" }),
    resultado: z.enum(ResultadoInspecao).meta({ example: "Aprovada" }),
    parecer: z.string().optional(),
  })
  .meta({ id: "RegistrarInspecaoCargaBody" });

export const AssumirResponsabilidadeTecnicaBodySchema = z
  .object({
    responsavelTecnicoId: z.guid()
      .meta({ example: "22222222-2222-2222-2222-222222222222" }),
  })
  .meta({ id: "AssumirResponsabilidadeTecnicaBody" });

export const HistoricoCargaRespostaSchema = z
  .object({
    data: z.array(HistoricoStatusRespostaSchema),
  })
  .meta({
    example: {
      data: [
        {
          statusAnterior: null,
          statusNovo: StatusCarga.Registrada,
          motivo: null,
          ocorridoEm: "2026-01-01T08:00:00.000Z",
        },
        {
          statusAnterior: StatusCarga.Registrada,
          statusNovo: StatusCarga.EmAnalise,
          motivo: null,
          ocorridoEm: "2026-01-01T09:00:00.000Z",
        },
      ],
    },
  });

export const DocumentoCargaParamsSchema = z.object({
  id: z.guid(),
  documentoId: z.guid(),
});
