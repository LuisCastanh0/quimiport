import { z } from "zod";

export const ResponsavelTecnicoRespostaSchema = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  registroNumero: z.string(),
  registroOrgao: z.string(),
  especialidade: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CadastrarResponsavelTecnicoBodySchema = z
  .object({
    nome: z.string().min(1).meta({ example: "Ana Paula Ferreira" }),
    registroNumero: z.string().min(1).meta({ example: "CRQ-04123456" }),
    registroOrgao: z.string().min(1).meta({ example: "CRQ" }),
    especialidade: z.string().optional().meta({ example: "Engenharia Química" }),
  })
  .meta({ id: "CadastrarResponsavelTecnicoBody" });

export const ListarResponsaveisTecnicosRespostaSchema = z.object({
  data: z.array(ResponsavelTecnicoRespostaSchema),
});
