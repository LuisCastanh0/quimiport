import { ProdutoQuimicoError } from "../../../domain/produto-quimico/errors/ProdutoQuimicoError.js";
import type { IProdutoQuimicoRepository } from "../../../domain/produto-quimico/IProdutoQuimicoRepository.js";
import type { ProdutoQuimico } from "../../../domain/produto-quimico/ProdutoQuimico.js";
import type { IUseCase } from "../../IUseCase.js";
import type { IClock } from "../../ports/IClock.js";
import type { ILogger } from "../../ports/ILogger.js";

export interface AtualizarProdutoQuimicoInput {
  readonly produtoId: string;
  readonly nome: string;
  readonly descricao?: string;
  readonly numeroOnu?: string;
  readonly classeRisco: string;
  readonly grupoCompatibilidade: string;
}

export interface AtualizarProdutoQuimicoOutput {
  readonly produto: ProdutoQuimico;
}

/** PUT /produtos-quimicos/:id — atualização completa; não altera `status`. */
export class AtualizarProdutoQuimico
  implements IUseCase<AtualizarProdutoQuimicoInput, AtualizarProdutoQuimicoOutput>
{
  constructor(
    private readonly repositorio: IProdutoQuimicoRepository,
    private readonly clock: IClock,
    private readonly logger: ILogger,
  ) {}

  async executar(input: AtualizarProdutoQuimicoInput): Promise<AtualizarProdutoQuimicoOutput> {
    const produto = await this.repositorio.buscarPorId(input.produtoId);
    if (!produto) {
      throw ProdutoQuimicoError.naoEncontrado(input.produtoId);
    }
    const outroComMesmoNome = await this.repositorio.buscarPorNome(input.nome);
    if (outroComMesmoNome && outroComMesmoNome.id !== produto.id) {
      throw ProdutoQuimicoError.nomeDuplicado(input.nome);
    }
    produto.atualizarDados({
      nome: input.nome,
      descricao: input.descricao,
      numeroOnu: input.numeroOnu,
      classeRisco: input.classeRisco,
      grupoCompatibilidade: input.grupoCompatibilidade,
      agora: this.clock.agora(),
    });
    await this.repositorio.salvar(produto);
    this.logger.info("produto.atualizado", { produtoId: produto.id });
    return { produto };
  }
}
