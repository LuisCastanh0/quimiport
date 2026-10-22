import { DomainError } from "../../shared/errors/DomainError.js";

export enum ResultadoInspecao {
  Pendente = "Pendente",
  Aprovada = "Aprovada",
  Reprovada = "Reprovada",
}

export class InspecaoError extends DomainError {
  private constructor(mensagem: string, campo: string) {
    super({
      regra: "RN07",
      tipo: "validacao",
      codigo: "VALIDACAO",
      mensagem,
      detalhes: [{ campo, mensagem }],
    });
  }

  static inspetorAusente(): InspecaoError {
    return new InspecaoError("Inspetor responsável é obrigatório.", "inspecao.inspetorResponsavel");
  }
}

/** Entidade interna ao agregado `CargaQuimica`. */
export class Inspecao {
  private constructor(
    readonly id: string,
    readonly dataInspecao: Date,
    readonly inspetorResponsavel: string,
    readonly resultado: ResultadoInspecao,
    readonly parecer: string | undefined,
    readonly createdAt: Date,
  ) {}

  static registrar(params: {
    id: string;
    dataInspecao: Date;
    inspetorResponsavel: string;
    resultado: ResultadoInspecao;
    parecer?: string;
    agora: Date;
  }): Inspecao {
    if (!params.inspetorResponsavel.trim()) {
      throw InspecaoError.inspetorAusente();
    }
    return new Inspecao(
      params.id,
      params.dataInspecao,
      params.inspetorResponsavel.trim(),
      params.resultado,
      params.parecer,
      params.agora,
    );
  }

  static reconstituir(params: {
    id: string;
    dataInspecao: Date;
    inspetorResponsavel: string;
    resultado: ResultadoInspecao;
    parecer: string | undefined;
    createdAt: Date;
  }): Inspecao {
    return new Inspecao(
      params.id,
      params.dataInspecao,
      params.inspetorResponsavel,
      params.resultado,
      params.parecer,
      params.createdAt,
    );
  }
}
