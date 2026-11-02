import type {
  FiltroProdutoQuimico,
  IProdutoQuimicoRepository,
  ResultadoListaProdutoQuimico,
} from "../../../domain/produto-quimico/IProdutoQuimicoRepository.js";
import type { ProdutoQuimico } from "../../../domain/produto-quimico/ProdutoQuimico.js";

/** Fake usado nos testes unitários da camada de aplicação (sem I/O real). */
export class InMemoryProdutoQuimicoRepository implements IProdutoQuimicoRepository {
  private readonly registros = new Map<string, ProdutoQuimico>();

  async salvar(produto: ProdutoQuimico): Promise<void> {
    this.registros.set(produto.id, produto);
  }

  async buscarPorId(id: string): Promise<ProdutoQuimico | null> {
    return this.registros.get(id) ?? null;
  }

  async buscarPorNome(nome: string): Promise<ProdutoQuimico | null> {
    const alvo = nome.trim().toLowerCase();
    for (const produto of this.registros.values()) {
      if (produto.nome.toLowerCase() === alvo) {
        return produto;
      }
    }
    return null;
  }

  async listar(filtro: FiltroProdutoQuimico): Promise<ResultadoListaProdutoQuimico> {
    let dados = [...this.registros.values()];
    if (filtro.status) {
      dados = dados.filter((produto) => produto.status === filtro.status);
    }
    if (filtro.classeRisco) {
      dados = dados.filter(
        (produto) => produto.classificacaoRisco.classeRisco === filtro.classeRisco,
      );
    }
    if (filtro.nome) {
      const termo = filtro.nome.toLowerCase();
      dados = dados.filter((produto) => produto.nome.toLowerCase().includes(termo));
    }
    const total = dados.length;
    const pagina = filtro.pagina ?? 1;
    const limite = filtro.limite ?? 20;
    const inicio = (pagina - 1) * limite;
    return { dados: dados.slice(inicio, inicio + limite), total };
  }
}
