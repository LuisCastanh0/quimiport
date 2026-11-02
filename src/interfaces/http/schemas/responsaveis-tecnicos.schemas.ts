import { z } from "zod";

const RESPONSAVEL_TECNICO_EXEMPLO = {
  id: "22222222-2222-2222-2222-222222222222",
  nome: "Ana Paula Ferreira",
  registroNumero: "CRQ-04123456",
  registroOrgao: "CRQ",
  especialidade: "Engenharia Química",
  createdAt: "2026-01-01T12:00:00.000Z",
  updatedAt: "2026-01-01T12:00:00.000Z",
};

export const ResponsavelTecnicoRespostaSchema = z
  .object({
    id: z.guid(),
    nome: z.string(),
    registroNumero: z.string(),
    registroOrgao: z.string(),
    especialidade: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .meta({ example: RESPONSAVEL_TECNICO_EXEMPLO });

export const CadastrarResponsavelTecnicoBodySchema = z
  .object({
    nome: z.string().min(1).meta({ example: "Ana Paula Ferreira" }),
    registroNumero: z.string().min(1).meta({ example: "CRQ-04123456" }),
    registroOrgao: z.string().min(1).meta({ example: "CRQ" }),
    especialidade: z.string().optional().meta({ example: "Engenharia Química" }),
  })
  .meta({ id: "CadastrarResponsavelTecnicoBody" });

export const ListarResponsaveisTecnicosRespostaSchema = z
  .object({
    data: z.array(ResponsavelTecnicoRespostaSchema),
  })
  .meta({ example: { data: [RESPONSAVEL_TECNICO_EXEMPLO] } });
