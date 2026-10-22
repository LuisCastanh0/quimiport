import { ResponsavelTecnicoError } from "./errors/ResponsavelTecnicoError.js";
import { RegistroProfissional } from "./value-objects/RegistroProfissional.js";

/** Agregado independente (Fase 1, `dominio.md` §5). */
export class ResponsavelTecnico {
  private constructor(
    readonly id: string,
    readonly nome: string,
    readonly registroProfissional: RegistroProfissional,
    readonly especialidade: string | undefined,
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}

  static cadastrar(params: {
    id: string;
    nome: string;
    registroNumero: string;
    registroOrgao: string;
    especialidade?: string;
    agora: Date;
  }): ResponsavelTecnico {
    const nome = params.nome.trim();
    if (!nome) {
      throw ResponsavelTecnicoError.nomeAusente();
    }
    const registroProfissional = RegistroProfissional.criar(
      params.registroNumero,
      params.registroOrgao,
    );
    return new ResponsavelTecnico(
      params.id,
      nome,
      registroProfissional,
      params.especialidade?.trim() || undefined,
      params.agora,
      params.agora,
    );
  }

  static reconstituir(params: {
    id: string;
    nome: string;
    registroNumero: string;
    registroOrgao: string;
    especialidade: string | undefined;
    createdAt: Date;
    updatedAt: Date;
  }): ResponsavelTecnico {
    return new ResponsavelTecnico(
      params.id,
      params.nome,
      RegistroProfissional.criar(params.registroNumero, params.registroOrgao),
      params.especialidade,
      params.createdAt,
      params.updatedAt,
    );
  }
}
