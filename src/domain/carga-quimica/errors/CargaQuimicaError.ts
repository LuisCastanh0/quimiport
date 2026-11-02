import { DomainError, type DetalheErro } from "../../../shared/errors/DomainError.js";
import type { StatusCarga } from "../StatusCarga.js";

type Params = {
  regra: string;
  tipo: "validacao" | "naoEncontrado" | "conflito" | "regra";
  codigo: "VALIDACAO" | "NAO_ENCONTRADO" | "TRANSICAO_INVALIDA" | "CONFLITO" | "REGRA_DE_NEGOCIO";
  mensagem: string;
  detalhes?: ReadonlyArray<DetalheErro>;
};

/** Erros do agregado Carga Química, sempre carregando a regra violada (RNxx). */
export class CargaQuimicaError extends DomainError {
  private constructor(params: Params) {
    super(params);
  }

  static produtoNaoInformado(): CargaQuimicaError {
    return new CargaQuimicaError({
      regra: "RN01",
      tipo: "validacao",
      codigo: "VALIDACAO",
      mensagem: "Carga química não pode ser registrada sem produto químico associado.",
      detalhes: [{ campo: "produtoQuimicoId", mensagem: "produtoQuimicoId é obrigatório." }],
    });
  }

  static produtoNaoEncontrado(produtoId: string): CargaQuimicaError {
    return new CargaQuimicaError({
      regra: "RN01",
      tipo: "naoEncontrado",
      codigo: "NAO_ENCONTRADO",
      mensagem: `Produto químico "${produtoId}" não encontrado.`,
    });
  }

  static produtoInativo(): CargaQuimicaError {
    return new CargaQuimicaError({
      regra: "RN02",
      tipo: "regra",
      codigo: "REGRA_DE_NEGOCIO",
      mensagem: "Produto químico inativo não pode originar carga.",
    });
  }

  static responsavelTecnicoNaoInformado(): CargaQuimicaError {
    return new CargaQuimicaError({
      regra: "RN12",
      tipo: "validacao",
      codigo: "VALIDACAO",
      mensagem: "Toda carga deve possuir um responsável técnico informado.",
      detalhes: [
        { campo: "responsavelTecnicoId", mensagem: "responsavelTecnicoId é obrigatório." },
      ],
    });
  }

  static responsavelTecnicoNaoEncontrado(rtId: string): CargaQuimicaError {
    return new CargaQuimicaError({
      regra: "RN12",
      tipo: "naoEncontrado",
      codigo: "NAO_ENCONTRADO",
      mensagem: `Responsável técnico "${rtId}" não encontrado.`,
    });
  }

  static campoObrigatorioAusente(campo: string, mensagem: string): CargaQuimicaError {
    return new CargaQuimicaError({
      regra: "RN01",
      tipo: "validacao",
      codigo: "VALIDACAO",
      mensagem,
      detalhes: [{ campo, mensagem }],
    });
  }

  static cargaNaoEncontrada(id: string): CargaQuimicaError {
    return new CargaQuimicaError({
      regra: "RN01",
      tipo: "naoEncontrado",
      codigo: "NAO_ENCONTRADO",
      mensagem: `Carga química "${id}" não encontrada.`,
    });
  }

  static codigoDuplicado(codigo: string): CargaQuimicaError {
    return new CargaQuimicaError({
      regra: "RN01",
      tipo: "conflito",
      codigo: "CONFLITO",
      mensagem: `Já existe uma carga química com o código "${codigo}".`,
    });
  }

  static transicaoInvalida(de: StatusCarga, para: StatusCarga): CargaQuimicaError {
    return new CargaQuimicaError({
      regra: "RN14",
      tipo: "conflito",
      codigo: "TRANSICAO_INVALIDA",
      mensagem: `Transição de ${de} para ${para} não é permitida.`,
    });
  }

  static terminalImutavel(status: StatusCarga): CargaQuimicaError {
    return new CargaQuimicaError({
      regra: "RN15",
      tipo: "conflito",
      codigo: "TRANSICAO_INVALIDA",
      mensagem: `Carga no estado terminal "${status}" não pode ser alterada.`,
    });
  }

  static motivoObrigatorio(): CargaQuimicaError {
    return new CargaQuimicaError({
      regra: "RN14",
      tipo: "validacao",
      codigo: "VALIDACAO",
      mensagem: "Motivo é obrigatório para esta transição de status.",
      detalhes: [{ campo: "motivo", mensagem: "motivo é obrigatório." }],
    });
  }

  static documentacaoInvalida(): CargaQuimicaError {
    return new CargaQuimicaError({
      regra: "RN04",
      tipo: "regra",
      codigo: "REGRA_DE_NEGOCIO",
      mensagem:
        "Carga química não pode avançar sem documentação obrigatória completa, válida e não vencida.",
    });
  }

  static inspecaoNaoAprovada(): CargaQuimicaError {
    return new CargaQuimicaError({
      regra: "RN07",
      tipo: "regra",
      codigo: "REGRA_DE_NEGOCIO",
      mensagem: "Carga química não pode ser liberada sem inspeção mais recente aprovada.",
    });
  }

  static aceiteResponsavelTecnicoNaoRegistrado(): CargaQuimicaError {
    return new CargaQuimicaError({
      regra: "RN13",
      tipo: "regra",
      codigo: "REGRA_DE_NEGOCIO",
      mensagem:
        "Carga química não pode ser liberada sem aceite formal do responsável técnico.",
    });
  }

  static aceiteResponsavelTecnicoJaRegistrado(): CargaQuimicaError {
    return new CargaQuimicaError({
      regra: "RN13",
      tipo: "conflito",
      codigo: "CONFLITO",
      mensagem: "O aceite do responsável técnico já foi registrado para esta carga.",
    });
  }

  static responsavelTecnicoNaoVinculado(): CargaQuimicaError {
    return new CargaQuimicaError({
      regra: "RN13",
      tipo: "regra",
      codigo: "REGRA_DE_NEGOCIO",
      mensagem: "Apenas o responsável técnico vinculado à carga pode assumi-la.",
    });
  }

  static operacaoNaoPermitidaNoStatusAtual(status: StatusCarga, operacao: string): CargaQuimicaError {
    return new CargaQuimicaError({
      regra: "RN14",
      tipo: "conflito",
      codigo: "TRANSICAO_INVALIDA",
      mensagem: `Não é possível ${operacao} com a carga no status "${status}".`,
    });
  }

  static documentoDuplicado(tipo: string): CargaQuimicaError {
    return new CargaQuimicaError({
      regra: "RN17",
      tipo: "conflito",
      codigo: "CONFLITO",
      mensagem: `Já existe um documento do tipo "${tipo}" cadastrado para esta carga.`,
    });
  }

  static documentoNaoEncontrado(documentoId: string): CargaQuimicaError {
    return new CargaQuimicaError({
      regra: "RN17",
      tipo: "naoEncontrado",
      codigo: "NAO_ENCONTRADO",
      mensagem: `Documento "${documentoId}" não encontrado nesta carga.`,
    });
  }

  static conflitoDeVersao(): CargaQuimicaError {
    return new CargaQuimicaError({
      regra: "RN14",
      tipo: "conflito",
      codigo: "CONFLITO",
      mensagem: "A carga química foi alterada por outra operação concorrente; recarregue e tente novamente.",
    });
  }
}
