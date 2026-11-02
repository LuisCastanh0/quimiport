import { DomainError } from "../../shared/errors/DomainError.js";

export class AreaArmazenamentoError extends DomainError {
  private constructor(mensagem: string, campo: string) {
    super({
      regra: "RN01",
      tipo: "validacao",
      codigo: "VALIDACAO",
      mensagem,
      detalhes: [{ campo, mensagem }],
    });
  }

  static codigoAusente(): AreaArmazenamentoError {
    return new AreaArmazenamentoError("Área de armazenamento requer um código.", "codigo");
  }
}

/**
 * Agregado independente (Fase 1, `dominio.md` §5). Mantido como modelado,
 * mas não exposto pela API nesta fase (fora do escopo do PDF da Fase 2) —
 * ver `docs/modelagem-de-dados.md`, "como os dados podem evoluir".
 */
export class AreaArmazenamento {
  private constructor(
    readonly id: string,
    readonly codigo: string,
    readonly capacidade: number | undefined,
    readonly restricoes: string | undefined,
  ) {}

  static criar(params: {
    id: string;
    codigo: string;
    capacidade?: number;
    restricoes?: string;
  }): AreaArmazenamento {
    const codigo = params.codigo.trim();
    if (!codigo) {
      throw AreaArmazenamentoError.codigoAusente();
    }
    return new AreaArmazenamento(params.id, codigo, params.capacidade, params.restricoes);
  }
}
