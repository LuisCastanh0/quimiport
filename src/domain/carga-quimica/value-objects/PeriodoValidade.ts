import { DomainError } from "../../../shared/errors/DomainError.js";

export class PeriodoValidadeError extends DomainError {
  private constructor(mensagem: string, campo: string) {
    super({
      regra: "RN17",
      tipo: "validacao",
      codigo: "VALIDACAO",
      mensagem,
      detalhes: [{ campo, mensagem }],
    });
  }

  static invalido(mensagem: string, campo: string): PeriodoValidadeError {
    return new PeriodoValidadeError(mensagem, campo);
  }
}

/**
 * Agrupamento de dados sem regra de validação própria complexa — por isso é
 * um `interface`/`type`, não uma classe (ver `typescript-javascript.md`).
 */
export interface PeriodoValidade {
  readonly dataEmissao: Date;
  readonly dataValidade: Date;
}

export function criarPeriodoValidade(dataEmissao: Date, dataValidade: Date): PeriodoValidade {
  if (dataValidade.getTime() < dataEmissao.getTime()) {
    throw PeriodoValidadeError.invalido(
      "Data de validade não pode ser anterior à data de emissão.",
      "dataValidade",
    );
  }
  return { dataEmissao, dataValidade };
}

/** RN17 — documento válido exige `dataValidade` não vencida na data de referência. */
export function periodoValidoEm(periodo: PeriodoValidade, referencia: Date): boolean {
  return periodo.dataValidade.getTime() >= referencia.getTime();
}
