import { DomainError } from "../../../shared/errors/DomainError.js";

export type UnidadeMedida = "kg" | "L" | "ton";

export const UNIDADES_MEDIDA: ReadonlyArray<UnidadeMedida> = ["kg", "L", "ton"];

export class QuantidadeError extends DomainError {
  private constructor(mensagem: string) {
    super({
      regra: "RN11",
      tipo: "validacao",
      codigo: "VALIDACAO",
      mensagem,
      detalhes: [{ campo: "quantidade.valor", mensagem }],
    });
  }

  static invalida(mensagem: string): QuantidadeError {
    return new QuantidadeError(mensagem);
  }
}

/**
 * Objeto de valor imutável. RN11 — a quantidade de uma carga deve ser maior
 * que zero.
 */
export class Quantidade {
  private constructor(
    readonly valor: number,
    readonly unidadeMedida: UnidadeMedida,
  ) {}

  static criar(valor: number, unidadeMedida: UnidadeMedida): Quantidade {
    if (!Number.isFinite(valor) || valor <= 0) {
      throw QuantidadeError.invalida("Quantidade deve ser maior que zero.");
    }
    if (!UNIDADES_MEDIDA.includes(unidadeMedida)) {
      throw QuantidadeError.invalida(
        `Unidade de medida "${unidadeMedida}" inválida; use kg, L ou ton.`,
      );
    }
    return new Quantidade(valor, unidadeMedida);
  }

  igual(outra: Quantidade): boolean {
    return this.valor === outra.valor && this.unidadeMedida === outra.unidadeMedida;
  }
}
