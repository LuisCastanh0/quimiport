import { ProdutoQuimicoError } from "../../../domain/produto-quimico/errors/ProdutoQuimicoError.js";
import type { IProdutoQuimicoRepository } from "../../../domain/produto-quimico/IProdutoQuimicoRepository.js";
import type { ProdutoQuimico } from "../../../domain/produto-quimico/ProdutoQuimico.js";
import type { IUseCase } from "../../IUseCase.js";

export interface BuscarProdutoQuimicoPorIdInput {
  readonly produtoId: string;
}

export interface BuscarProdutoQuimicoPorIdOutput {
  readonly produto: ProdutoQuimico;
}

export class BuscarProdutoQuimicoPorId
  implements IUseCase<BuscarProdutoQuimicoPorIdInput, BuscarProdutoQuimicoPorIdOutput>
{
  constructor(private readonly repositorio: IProdutoQuimicoRepository) {}

  async executar(
    input: BuscarProdutoQuimicoPorIdInput,
  ): Promise<BuscarProdutoQuimicoPorIdOutput> {
    const produto = await this.repositorio.buscarPorId(input.produtoId);
    if (!produto) {
      throw ProdutoQuimicoError.naoEncontrado(input.produtoId);
    }
    return { produto };
  }
}
