import { ProdutoQuimicoError } from "../../../domain/produto-quimico/errors/ProdutoQuimicoError.js";
import type { IProdutoQuimicoRepository } from "../../../domain/produto-quimico/IProdutoQuimicoRepository.js";
import type { ProdutoQuimico } from "../../../domain/produto-quimico/ProdutoQuimico.js";
import type { IUseCase } from "../../IUseCase.js";
import type { IClock } from "../../ports/IClock.js";
import type { ILogger } from "../../ports/ILogger.js";

export interface InativarProdutoQuimicoInput {
  readonly produtoId: string;
}

export interface InativarProdutoQuimicoOutput {
  readonly produto: ProdutoQuimico;
}

/** UC02 — Inativar produto químico. */
export class InativarProdutoQuimico
  implements IUseCase<InativarProdutoQuimicoInput, InativarProdutoQuimicoOutput>
{
  constructor(
    private readonly repositorio: IProdutoQuimicoRepository,
    private readonly clock: IClock,
    private readonly logger: ILogger,
  ) {}

  async executar(input: InativarProdutoQuimicoInput): Promise<InativarProdutoQuimicoOutput> {
    const produto = await this.repositorio.buscarPorId(input.produtoId);
    if (!produto) {
      throw ProdutoQuimicoError.naoEncontrado(input.produtoId);
    }
    produto.inativar(this.clock.agora());
    await this.repositorio.salvar(produto);
    this.logger.info("produto.inativado", { produtoId: produto.id });
    return { produto };
  }
}
