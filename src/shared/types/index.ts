export type Id = string;

export interface Pagina<T> {
  readonly dados: ReadonlyArray<T>;
  readonly pagina: number;
  readonly limite: number;
  readonly total: number;
}

export interface FiltroPagina {
  readonly pagina?: number;
  readonly limite?: number;
}
