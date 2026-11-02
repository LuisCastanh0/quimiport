import { ClassificacaoRisco } from "../carga-quimica/value-objects/ClassificacaoRisco.js";
import { ProdutoQuimicoError } from "./errors/ProdutoQuimicoError.js";
import { StatusProduto } from "./StatusProduto.js";

const PADRAO_NUMERO_ONU = /^UN\d{4}$/;

function validarCamposObrigatorios(params: {
  nome: string;
  classeRisco: string;
  grupoCompatibilidade: string;
  numeroOnu?: string;
}): { nome: string; grupoCompatibilidade: string } {
  const nome = params.nome.trim();
  if (!nome) {
    throw ProdutoQuimicoError.nomeAusente();
  }
  if (!params.classeRisco) {
    throw ProdutoQuimicoError.classeRiscoAusente();
  }
  const grupoCompatibilidade = params.grupoCompatibilidade.trim();
  if (!grupoCompatibilidade) {
    throw ProdutoQuimicoError.grupoCompatibilidadeAusente();
  }
  if (params.numeroOnu && !PADRAO_NUMERO_ONU.test(params.numeroOnu)) {
    throw ProdutoQuimicoError.numeroOnuInvalido(params.numeroOnu);
  }
  return { nome, grupoCompatibilidade };
}

/**
 * Agregado independente (Fase 1, `dominio.md` §5). Referenciado pela Carga
 * Química por identidade (`produtoQuimicoId`), nunca incluído em seu
 * agregado.
 */
export class ProdutoQuimico {
  private _nome: string;
  private _descricao: string | undefined;
  private _numeroOnu: string | undefined;
  private _classificacaoRisco: ClassificacaoRisco;
  private _grupoCompatibilidade: string;
  private _status: StatusProduto;
  private _updatedAt: Date;

  private constructor(
    readonly id: string,
    nome: string,
    descricao: string | undefined,
    numeroOnu: string | undefined,
    classificacaoRisco: ClassificacaoRisco,
    grupoCompatibilidade: string,
    status: StatusProduto,
    readonly createdAt: Date,
    updatedAt: Date,
  ) {
    this._nome = nome;
    this._descricao = descricao;
    this._numeroOnu = numeroOnu;
    this._classificacaoRisco = classificacaoRisco;
    this._grupoCompatibilidade = grupoCompatibilidade;
    this._status = status;
    this._updatedAt = updatedAt;
  }

  static cadastrar(params: {
    id: string;
    nome: string;
    descricao?: string;
    numeroOnu?: string;
    classeRisco: string;
    grupoCompatibilidade: string;
    agora: Date;
  }): ProdutoQuimico {
    const { nome, grupoCompatibilidade } = validarCamposObrigatorios(params);
    return new ProdutoQuimico(
      params.id,
      nome,
      params.descricao?.trim() || undefined,
      params.numeroOnu,
      ClassificacaoRisco.criar(params.classeRisco),
      grupoCompatibilidade,
      StatusProduto.Ativo,
      params.agora,
      params.agora,
    );
  }

  static reconstituir(params: {
    id: string;
    nome: string;
    descricao: string | undefined;
    numeroOnu: string | undefined;
    classeRisco: string;
    grupoCompatibilidade: string;
    status: StatusProduto;
    createdAt: Date;
    updatedAt: Date;
  }): ProdutoQuimico {
    return new ProdutoQuimico(
      params.id,
      params.nome,
      params.descricao,
      params.numeroOnu,
      ClassificacaoRisco.criar(params.classeRisco),
      params.grupoCompatibilidade,
      params.status,
      params.createdAt,
      params.updatedAt,
    );
  }

  get nome(): string {
    return this._nome;
  }

  get descricao(): string | undefined {
    return this._descricao;
  }

  get numeroOnu(): string | undefined {
    return this._numeroOnu;
  }

  get classificacaoRisco(): ClassificacaoRisco {
    return this._classificacaoRisco;
  }

  get grupoCompatibilidade(): string {
    return this._grupoCompatibilidade;
  }

  get status(): StatusProduto {
    return this._status;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  /** RN02/RN10 — produto inativo não pode originar nova carga. */
  podeSerUsadoEmNovaCarga(): boolean {
    return this._status === StatusProduto.Ativo;
  }

  /** UC02 — inativação é lógica; 409 se já inativo. */
  inativar(agora: Date): void {
    if (this._status === StatusProduto.Inativo) {
      throw ProdutoQuimicoError.jaInativo();
    }
    this._status = StatusProduto.Inativo;
    this._updatedAt = agora;
  }

  atualizarDados(params: {
    nome: string;
    descricao?: string;
    numeroOnu?: string;
    classeRisco: string;
    grupoCompatibilidade: string;
    agora: Date;
  }): void {
    const { nome, grupoCompatibilidade } = validarCamposObrigatorios(params);
    this._nome = nome;
    this._descricao = params.descricao?.trim() || undefined;
    this._numeroOnu = params.numeroOnu;
    this._classificacaoRisco = ClassificacaoRisco.criar(params.classeRisco);
    this._grupoCompatibilidade = grupoCompatibilidade;
    this._updatedAt = params.agora;
  }
}
