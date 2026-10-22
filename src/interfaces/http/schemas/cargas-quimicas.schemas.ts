import { z } from "zod";
import { TipoDocumento, StatusValidacaoDocumento } from "../../../domain/carga-quimica/DocumentoCarga.js";
import { ResultadoInspecao } from "../../../domain/carga-quimica/Inspecao.js";
import { StatusCarga } from "../../../domain/carga-quimica/StatusCarga.js";
import { paginaMetaSchema } from "./common.schemas.js";
import { ClasseRiscoSchema } from "./produtos-quimicos.schemas.js";

export const UnidadeMedidaSchema = z.enum(["kg", "L", "ton"]);

export const DocumentoCargaRespostaSchema = z.object({
  id: z.string().uuid(),
  tipo: z.enum(TipoDocumento),
  numero: z.string(),
  dataEmissao: z.string(),
  dataValidade: z.string(),
  statusValidacao: z.enum(StatusValidacaoDocumento),
});

export const InspecaoRespostaSchema = z.object({
  id: z.string().uuid(),
  dataInspecao: z.string(),
  inspetorResponsavel: z.string(),
  resultado: z.enum(ResultadoInspecao),
  parecer: z.string().nullable(),
});

export const HistoricoStatusRespostaSchema = z.object({
  statusAnterior: z.enum(StatusCarga).nullable(),
  statusNovo: z.enum(StatusCarga),
  motivo: z.string().nullable(),
  ocorridoEm: z.string(),
});

export const CargaQuimicaRespostaSchema = z.object({
  id: z.string().uuid(),
  codigo: z.string(),
  produtoQuimicoId: z.string().uuid(),
  quantidade: z.object({ valor: z.number(), unidadeMedida: UnidadeMedidaSchema }),
  classeRisco: z.string(),
  origem: z.string(),
  destino: z.string(),
  responsavelTecnicoId: z.string().uuid(),
  status: z.enum(StatusCarga),
  aceiteResponsavelTecnico: z.string().nullable(),
  dataEntrada: z.string(),
  documentos: z.array(DocumentoCargaRespostaSchema).optional(),
  inspecoes: z.array(InspecaoRespostaSchema).optional(),
});

const DocumentoInicialSchema = z.object({
  tipo: z.enum(TipoDocumento),
  numero: z.string().min(1),
  dataEmissao: z.iso.datetime(),
  dataValidade: z.iso.datetime(),
});

export const RegistrarCargaQuimicaBodySchema = z
  .object({
    produtoQuimicoId: z.string().uuid().meta({ example: "11111111-1111-1111-1111-111111111111" }),
    quantidade: z.object({
      valor: z.number().positive().meta({ example: 1500 }),
      unidadeMedida: UnidadeMedidaSchema.meta({ example: "kg" }),
    }),
    origem: z.string().min(1).meta({ example: "Píer 1 — Porto de Santos" }),
    destino: z.string().min(1).meta({ example: "Armazém Central" }),
    responsavelTecnicoId: z.string().uuid().meta({ example: "22222222-2222-2222-2222-222222222222" }),
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
  produtoQuimicoId: z.string().uuid().optional(),
});

export const ListarCargasQuimicasRespostaSchema = z.object({
  data: z.array(CargaQuimicaRespostaSchema),
  meta: paginaMetaSchema(),
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
  .object({ status: z.enum([StatusValidacaoDocumento.Valido, StatusValidacaoDocumento.Invalido]) })
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
  .object({ responsavelTecnicoId: z.string().uuid() })
  .meta({ id: "AssumirResponsabilidadeTecnicaBody" });

export const HistoricoCargaRespostaSchema = z.object({
  data: z.array(HistoricoStatusRespostaSchema),
});

export const DocumentoCargaParamsSchema = z.object({
  id: z.string().uuid(),
  documentoId: z.string().uuid(),
});
