import { DomainError } from "../../shared/errors/DomainError.js";
import { periodoValidoEm, type PeriodoValidade } from "./value-objects/PeriodoValidade.js";

export enum TipoDocumento {
  FichaSeguranca = "FichaSeguranca",
  LaudoTecnico = "LaudoTecnico",
  LicencaTransporte = "LicencaTransporte",
}

export const TIPOS_DOCUMENTO: ReadonlyArray<TipoDocumento> = Object.values(TipoDocumento);

export enum StatusValidacaoDocumento {
  Pendente = "Pendente",
  Valido = "Valido",
  Invalido = "Invalido",
}

export class DocumentoCargaError extends DomainError {
  private constructor(mensagem: string, campo: string) {
    super({
      regra: "RN17",
      tipo: "validacao",
      codigo: "VALIDACAO",
      mensagem,
      detalhes: [{ campo, mensagem }],
    });
  }

  static tipoInvalido(tipo: string): DocumentoCargaError {
    return new DocumentoCargaError(
      `Tipo de documento "${tipo}" não reconhecido.`,
      "documento.tipo",
    );
  }

  static numeroAusente(): DocumentoCargaError {
    return new DocumentoCargaError("Número do documento é obrigatório.", "documento.numero");
  }
}

/**
 * Entidade interna ao agregado `CargaQuimica` — só existe no contexto de
 * uma carga, nunca acessada diretamente por repositório próprio.
 */
export class DocumentoCarga {
  private _statusValidacao: StatusValidacaoDocumento;
  private _updatedAt: Date;

  private constructor(
    readonly id: string,
    readonly tipo: TipoDocumento,
    readonly numero: string,
    readonly periodoValidade: PeriodoValidade,
    statusValidacao: StatusValidacaoDocumento,
    readonly createdAt: Date,
    updatedAt: Date,
  ) {
    this._statusValidacao = statusValidacao;
    this._updatedAt = updatedAt;
  }

  static registrar(params: {
    id: string;
    tipo: TipoDocumento;
    numero: string;
    periodoValidade: PeriodoValidade;
    agora: Date;
  }): DocumentoCarga {
    if (!TIPOS_DOCUMENTO.includes(params.tipo)) {
      throw DocumentoCargaError.tipoInvalido(params.tipo);
    }
    if (!params.numero.trim()) {
      throw DocumentoCargaError.numeroAusente();
    }
    return new DocumentoCarga(
      params.id,
      params.tipo,
      params.numero.trim(),
      params.periodoValidade,
      StatusValidacaoDocumento.Pendente,
      params.agora,
      params.agora,
    );
  }

  /** Reconstrução a partir da persistência — não reaplica regras de criação. */
  static reconstituir(params: {
    id: string;
    tipo: TipoDocumento;
    numero: string;
    periodoValidade: PeriodoValidade;
    statusValidacao: StatusValidacaoDocumento;
    createdAt: Date;
    updatedAt: Date;
  }): DocumentoCarga {
    return new DocumentoCarga(
      params.id,
      params.tipo,
      params.numero,
      params.periodoValidade,
      params.statusValidacao,
      params.createdAt,
      params.updatedAt,
    );
  }

  get statusValidacao(): StatusValidacaoDocumento {
    return this._statusValidacao;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  atualizarValidacao(status: StatusValidacaoDocumento, agora: Date): void {
    this._statusValidacao = status;
    this._updatedAt = agora;
  }

  /** RN17 — válido = status `Valido` e dentro do período de validade. */
  estaValidoEm(referencia: Date): boolean {
    return (
      this._statusValidacao === StatusValidacaoDocumento.Valido &&
      periodoValidoEm(this.periodoValidade, referencia)
    );
  }
}
