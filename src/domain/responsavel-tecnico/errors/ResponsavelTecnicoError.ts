import { DomainError, type DetalheErro } from "../../../shared/errors/DomainError.js";

type Params = {
  regra: string;
  tipo: "validacao" | "naoEncontrado" | "conflito" | "regra";
  codigo: "VALIDACAO" | "NAO_ENCONTRADO" | "TRANSICAO_INVALIDA" | "CONFLITO" | "REGRA_DE_NEGOCIO";
  mensagem: string;
  detalhes?: ReadonlyArray<DetalheErro>;
};

export class ResponsavelTecnicoError extends DomainError {
  private constructor(params: Params) {
    super(params);
  }

  static nomeAusente(): ResponsavelTecnicoError {
    return new ResponsavelTecnicoError({
      regra: "RN12",
      tipo: "validacao",
      codigo: "VALIDACAO",
      mensagem: "Responsável técnico não pode ser cadastrado sem nome.",
      detalhes: [{ campo: "nome", mensagem: "nome é obrigatório." }],
    });
  }

  static naoEncontrado(id: string): ResponsavelTecnicoError {
    return new ResponsavelTecnicoError({
      regra: "RN12",
      tipo: "naoEncontrado",
      codigo: "NAO_ENCONTRADO",
      mensagem: `Responsável técnico "${id}" não encontrado.`,
    });
  }
}
