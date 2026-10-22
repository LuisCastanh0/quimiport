import type { FiltroProdutoQuimico } from "../../../domain/produto-quimico/IProdutoQuimicoRepository.js";
import type { IProdutoQuimicoRepository } from "../../../domain/produto-quimico/IProdutoQuimicoRepository.js";
import type { ProdutoQuimico } from "../../../domain/produto-quimico/ProdutoQuimico.js";
import type { IUseCase } from "../../IUseCase.js";

export type ListarProdutosQuimicosInput = FiltroProdutoQuimico;

export interface ListarProdutosQuimicosOutput {
  readonly dados: ReadonlyArray<ProdutoQuimico>;
  readonly total: number;
  readonly pagina: number;
  readonly limite: number;
}

/** UC — Consultar produtos químicos (somente leitura). */
export class ListarProdutosQuimicos
  implements IUseCase<ListarProdutosQuimicosInput, ListarProdutosQuimicosOutput>
{
  constructor(private readonly repositorio: IProdutoQuimicoRepository) {}

  async executar(input: ListarProdutosQuimicosInput): Promise<ListarProdutosQuimicosOutput> {
    const pagina = input.pagina ?? 1;
    const limite = input.limite ?? 20;
    const resultado = await this.repositorio.listar({ ...input, pagina, limite });
    return { dados: resultado.dados, total: resultado.total, pagina, limite };
  }
}
