import { z } from "zod";
import { StatusProduto } from "../../../domain/produto-quimico/StatusProduto.js";
import { paginaMetaSchema } from "./common.schemas.js";

export const ClasseRiscoSchema = z.enum(["1", "2", "3", "4", "5", "6", "7", "8", "9"]);

export const ProdutoQuimicoRespostaSchema = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  descricao: z.string().nullable(),
  numeroOnu: z.string().nullable(),
  classeRisco: z.string(),
  categoriaPerigo: z.string(),
  grupoCompatibilidade: z.string(),
  status: z.enum(StatusProduto),
  createdAt: z.string(),
  updatedAt: z.string(),
});

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

export const ListarProdutosQuimicosRespostaSchema = z.object({
  data: z.array(ProdutoQuimicoRespostaSchema),
  meta: paginaMetaSchema(),
});
