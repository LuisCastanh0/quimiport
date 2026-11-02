import { z } from "zod";
import { StatusProduto } from "../../../domain/produto-quimico/StatusProduto.js";
import { paginaMetaSchema } from "./common.schemas.js";

export const ClasseRiscoSchema = z.enum(["1", "2", "3", "4", "5", "6", "7", "8", "9"]);

const PRODUTO_QUIMICO_EXEMPLO = {
  id: "11111111-1111-1111-1111-111111111111",
  nome: "Ácido Sulfúrico",
  descricao: "Ácido inorgânico forte.",
  numeroOnu: "UN1830",
  classeRisco: "8",
  categoriaPerigo: "Substâncias corrosivas",
  grupoCompatibilidade: "A",
  status: StatusProduto.Ativo,
  createdAt: "2026-01-01T12:00:00.000Z",
  updatedAt: "2026-01-01T12:00:00.000Z",
};

export const ProdutoQuimicoRespostaSchema = z
  .object({
    id: z.guid(),
    nome: z.string(),
    descricao: z.string().nullable(),
    numeroOnu: z.string().nullable(),
    classeRisco: z.string(),
    categoriaPerigo: z.string(),
    grupoCompatibilidade: z.string(),
    status: z.enum(StatusProduto),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .meta({ example: PRODUTO_QUIMICO_EXEMPLO });

export const CadastrarProdutoQuimicoBodySchema = z
  .object({
    nome: z.string().min(1).meta({ example: "Ácido Sulfúrico" }),
    descricao: z.string().optional().meta({ example: "Ácido inorgânico forte." }),
    numeroOnu: z
      .string()
      .regex(/^UN\d{4}$/)
      .optional()
      .meta({ example: "UN1830" }),
    classeRisco: ClasseRiscoSchema.meta({ example: "8" }),
    grupoCompatibilidade: z.string().min(1).meta({ example: "A" }),
  })
  .meta({ id: "CadastrarProdutoQuimicoBody" });

export const AtualizarProdutoQuimicoBodySchema = CadastrarProdutoQuimicoBodySchema.meta({
  id: "AtualizarProdutoQuimicoBody",
});

export const ListarProdutosQuimicosQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(StatusProduto).optional(),
  classeRisco: ClasseRiscoSchema.optional(),
  nome: z.string().optional(),
});

export const ListarProdutosQuimicosRespostaSchema = z
  .object({
    data: z.array(ProdutoQuimicoRespostaSchema),
    meta: paginaMetaSchema(),
  })
  .meta({
    example: { data: [PRODUTO_QUIMICO_EXEMPLO], meta: { page: 1, limit: 20, total: 1 } },
  });
