/**
 * Tipo de erro de domínio, usado pela borda HTTP para decidir o status code
 * (ver `interfaces/http/plugins/error-handler.ts` e §7.3 das instruções da
 * Fase 2):
 * - `validacao`: entrada mal formada ou campo obrigatório ausente -> 400
 * - `naoEncontrado`: entidade referenciada não existe -> 404
 * - `conflito`: estado atual impede a operação (transição inválida, duplicidade) -> 409
 * - `regra`: pré-condição de negócio não satisfeita -> 422
 */
export type TipoErroDominio = "validacao" | "naoEncontrado" | "conflito" | "regra";

export interface DetalheErro {
  readonly campo: string;
  readonly mensagem: string;
}

/**
 * Classe base para todos os erros lançados pelo domínio. Carrega o código da
 * regra de negócio violada (RNxx) para rastreabilidade com
 * `docs/regras-de-negocio.md`, o tipo (usado para mapear o status HTTP) e um
 * código de máquina estável (usado no corpo da resposta de erro).
 */
export abstract class DomainError extends Error {
  readonly regra: string;
  readonly tipo: TipoErroDominio;
  readonly codigo: string;
  readonly detalhes: ReadonlyArray<DetalheErro>;

  protected constructor(params: {
    regra: string;
    tipo: TipoErroDominio;
    codigo: string;
    mensagem: string;
    detalhes?: ReadonlyArray<DetalheErro>;
  }) {
    super(params.mensagem);
    this.name = new.target.name;
    this.regra = params.regra;
    this.tipo = params.tipo;
    this.codigo = params.codigo;
    this.detalhes = params.detalhes ?? [];
  }
}
