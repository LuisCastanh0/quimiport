import { ResponsavelTecnico } from "../../../../domain/responsavel-tecnico/ResponsavelTecnico.js";
import type { ResponsavelTecnico as ResponsavelTecnicoRow } from "../../../../../generated/prisma/client.js";

export const ResponsavelTecnicoMapper = {
  paraDominio(row: ResponsavelTecnicoRow): ResponsavelTecnico {
    return ResponsavelTecnico.reconstituir({
      id: row.id,
      nome: row.nome,
      registroNumero: row.registroNumero,
      registroOrgao: row.registroOrgao,
      especialidade: row.especialidade ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  },

  paraPersistencia(rt: ResponsavelTecnico) {
    return {
      nome: rt.nome,
      registroNumero: rt.registroProfissional.numero,
      registroOrgao: rt.registroProfissional.orgaoEmissor,
      especialidade: rt.especialidade ?? null,
    };
  },
};
