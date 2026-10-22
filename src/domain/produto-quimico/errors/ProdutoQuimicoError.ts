import { DomainError, type DetalheErro } from "../../../shared/errors/DomainError.js";

type Params = {
  regra: string;
  tipo: "validacao" | "naoEncontrado" | "conflito" | "regra";
  codigo: "VALIDACAO" | "NAO_ENCONTRADO" | "TRANSICAO_INVALIDA" | "CONFLITO" | "REGRA_DE_NEGOCIO";
  mensagem: string;
  detalhes?: ReadonlyArray<DetalheErro>;
};

export class ProdutoQuimicoError extends DomainError {
  private constructor(params: Params) {
    super(params);
  }

  static nomeAusente(): ProdutoQuimicoError {
    return new ProdutoQuimicoError({
      regra: "RN08",
      tipo: "validacao",
      codigo: "VALIDACAO",
      mensagem: "Produto químico não pode ser cadastrado sem nome.",
      detalhes: [{ campo: "nome", mensagem: "nome é obrigatório." }],
    });
  }

  static classeRiscoAusente(): ProdutoQuimicoError {
    return new ProdutoQuimicoError({
      regra: "RN09",
      tipo: "validacao",
      codigo: "VALIDACAO",
      mensagem: "Produto químico não pode ser cadastrado sem classe de risco.",
      detalhes: [{ campo: "classificacaoRisco.classeRisco", mensagem: "classeRisco é obrigatória." }],
    });
  }

  static numeroOnuInvalido(valor: string): ProdutoQuimicoError {
    return new ProdutoQuimicoError({
      regra: "RN08",
      tipo: "validacao",
      codigo: "VALIDACAO",
      mensagem: `Número ONU "${valor}" inválido; use o formato "UN" seguido de 4 dígitos (ex.: UN1203).`,
      detalhes: [{ campo: "numeroOnu", mensagem: "formato esperado: UN seguido de 4 dígitos." }],
    });
  }

  static grupoCompatibilidadeAusente(): ProdutoQuimicoError {
    return new ProdutoQuimicoError({
      regra: "RN08",
      tipo: "validacao",
      codigo: "VALIDACAO",
      mensagem: "Produto químico não pode ser cadastrado sem grupo de compatibilidade.",
      detalhes: [{ campo: "grupoCompatibilidade", mensagem: "grupoCompatibilidade é obrigatório." }],
    });
  }

  static naoEncontrado(id: string): ProdutoQuimicoError {
    return new ProdutoQuimicoError({
      regra: "RN01",
      tipo: "naoEncontrado",
      codigo: "NAO_ENCONTRADO",
      mensagem: `Produto químico "${id}" não encontrado.`,
    });
  }

  static jaInativo(): ProdutoQuimicoError {
    return new ProdutoQuimicoError({
      regra: "RN10",
      tipo: "conflito",
      codigo: "CONFLITO",
      mensagem: "Produto químico já está inativo.",
    });
  }

  static nomeDuplicado(nome: string): ProdutoQuimicoError {
    return new ProdutoQuimicoError({
      regra: "RN08",
      tipo: "conflito",
      codigo: "CONFLITO",
      mensagem: `Já existe um produto químico cadastrado com o nome "${nome}".`,
    });
  }
}
