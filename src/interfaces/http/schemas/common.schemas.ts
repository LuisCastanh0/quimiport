import { z } from "zod";

export const ErroRespostaSchema = z
  .object({
    codigo: z.enum(["VALIDACAO", "NAO_ENCONTRADO", "TRANSICAO_INVALIDA", "CONFLITO", "REGRA_DE_NEGOCIO", "ERRO_INTERNO"]),
    mensagem: z.string(),
    regra: z.string().optional(),
    detalhes: z.array(z.object({ campo: z.string(), mensagem: z.string() })).default([]),
    requestId: z.string(),
  })
  .meta({
    description: "Formato único de erro da API — ver seção de tratamento de erros do README.",
    example: {
      codigo: "TRANSICAO_INVALIDA",
      mensagem: "Transição de status não permitida: Bloqueada -> EmMovimentacao.",
      regra: "RN14",
      detalhes: [],
      requestId: "req-1",
    },
  });

export const PaginacaoQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export function paginaMetaSchema() {
  return z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
  });
}

export const IdParamsSchema = z.object({
  id: z.guid({ message: "id deve ser um UUID válido." }),
});
