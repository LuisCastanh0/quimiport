import { ProdutoQuimico } from "../../../domain/produto-quimico/ProdutoQuimico.js";
import { ProdutoQuimicoError } from "../../../domain/produto-quimico/errors/ProdutoQuimicoError.js";
import type { IProdutoQuimicoRepository } from "../../../domain/produto-quimico/IProdutoQuimicoRepository.js";
import type { IUseCase } from "../../IUseCase.js";
import type { IClock } from "../../ports/IClock.js";
import type { IIdGenerator } from "../../ports/IIdGenerator.js";
import type { ILogger } from "../../ports/ILogger.js";

export interface CadastrarProdutoQuimicoInput {
  readonly nome: string;
  readonly descricao?: string;
  readonly numeroOnu?: string;
  readonly classeRisco: string;
  readonly grupoCompatibilidade: string;
}

export interface CadastrarProdutoQuimicoOutput {
  readonly produto: ProdutoQuimico;
}

/** UC01 — Cadastrar produto químico. */
export class CadastrarProdutoQuimico
  implements IUseCase<CadastrarProdutoQuimicoInput, CadastrarProdutoQuimicoOutput>
{
  constructor(
    private readonly repositorio: IProdutoQuimicoRepository,
    private readonly clock: IClock,
    private readonly idGenerator: IIdGenerator,
    private readonly logger: ILogger,
  ) {}

  async executar(input: CadastrarProdutoQuimicoInput): Promise<CadastrarProdutoQuimicoOutput> {
    const existente = await this.repositorio.buscarPorNome(input.nome);
    if (existente) {
      throw ProdutoQuimicoError.nomeDuplicado(input.nome);
    }

    const produto = ProdutoQuimico.cadastrar({
      id: this.idGenerator.gerar(),
      nome: input.nome,
      descricao: input.descricao,
      numeroOnu: input.numeroOnu,
      classeRisco: input.classeRisco,
      grupoCompatibilidade: input.grupoCompatibilidade,
      agora: this.clock.agora(),
    });

    await this.repositorio.salvar(produto);
    this.logger.info("produto.criado", { produtoId: produto.id, nome: produto.nome });
    return { produto };
  }
}
