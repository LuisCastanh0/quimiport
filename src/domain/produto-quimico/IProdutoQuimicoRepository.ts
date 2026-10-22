import type { ProdutoQuimico } from "./ProdutoQuimico.js";
import type { StatusProduto } from "./StatusProduto.js";

export interface FiltroProdutoQuimico {
  readonly status?: StatusProduto;
  readonly classeRisco?: string;
  readonly nome?: string;
  readonly pagina?: number;
  readonly limite?: number;
}

export interface ResultadoListaProdutoQuimico {
  readonly dados: ReadonlyArray<ProdutoQuimico>;
  readonly total: number;
}

export interface IProdutoQuimicoRepository {
  salvar(produto: ProdutoQuimico): Promise<void>;
  buscarPorId(id: string): Promise<ProdutoQuimico | null>;
  buscarPorNome(nome: string): Promise<ProdutoQuimico | null>;
  listar(filtro: FiltroProdutoQuimico): Promise<ResultadoListaProdutoQuimico>;
}
