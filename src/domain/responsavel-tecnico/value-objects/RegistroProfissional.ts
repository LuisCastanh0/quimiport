import { DomainError } from "../../../shared/errors/DomainError.js";

export class RegistroProfissionalError extends DomainError {
  private constructor(mensagem: string, campo: string) {
    super({
      regra: "RN12",
      tipo: "validacao",
      codigo: "VALIDACAO",
      mensagem,
      detalhes: [{ campo, mensagem }],
    });
  }

  static invalido(mensagem: string, campo: string): RegistroProfissionalError {
    return new RegistroProfissionalError(mensagem, campo);
  }
}

/** Objeto de valor imutável usado por `ResponsavelTecnico`. */
export class RegistroProfissional {
  private constructor(
    readonly numero: string,
    readonly orgaoEmissor: string,
  ) {}

  static criar(numero: string, orgaoEmissor: string): RegistroProfissional {
    if (!numero?.trim()) {
      throw RegistroProfissionalError.invalido(
        "Número de registro profissional é obrigatório.",
        "registroProfissional.numero",
      );
    }
    if (!orgaoEmissor?.trim()) {
      throw RegistroProfissionalError.invalido(
        "Órgão emissor do registro profissional é obrigatório.",
        "registroProfissional.orgaoEmissor",
      );
    }
    return new RegistroProfissional(numero.trim(), orgaoEmissor.trim());
  }
}
