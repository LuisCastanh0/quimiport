import type { Container } from "../../../container.js";
import type { ProdutoQuimico } from "../../../domain/produto-quimico/ProdutoQuimico.js";
import type { ListarProdutosQuimicosInput } from "../../../application/use-cases/produto-quimico/ListarProdutosQuimicos.js";

export function paraRespostaProdutoQuimico(produto: ProdutoQuimico) {
  return {
    id: produto.id,
    nome: produto.nome,
    descricao: produto.descricao ?? null,
    numeroOnu: produto.numeroOnu ?? null,
    classeRisco: produto.classificacaoRisco.classeRisco,
    categoriaPerigo: produto.classificacaoRisco.categoriaPerigo,
    grupoCompatibilidade: produto.grupoCompatibilidade,
    status: produto.status,
    createdAt: produto.createdAt.toISOString(),
    updatedAt: produto.updatedAt.toISOString(),
  };
}

interface CadastrarOuAtualizarBody {
  nome: string;
  descricao?: string;
  numeroOnu?: string;
  classeRisco: string;
  grupoCompatibilidade: string;
}

/** Controller fino (ADR-04): converte requisição <-> DTO do caso de uso, sem regra própria. */
export const ProdutoQuimicoController = {
  async cadastrar(container: Container, body: CadastrarOuAtualizarBody) {
    const { produto } = await container.useCases.cadastrarProdutoQuimico.executar(body);
    return paraRespostaProdutoQuimico(produto);
  },

  async atualizar(container: Container, produtoId: string, body: CadastrarOuAtualizarBody) {
    const { produto } = await container.useCases.atualizarProdutoQuimico.executar({
      produtoId,
      ...body,
    });
    return paraRespostaProdutoQuimico(produto);
  },

  async inativar(container: Container, produtoId: string) {
    const { produto } = await container.useCases.inativarProdutoQuimico.executar({ produtoId });
    return paraRespostaProdutoQuimico(produto);
  },

  async buscarPorId(container: Container, produtoId: string) {
    const { produto } = await container.useCases.buscarProdutoQuimicoPorId.executar({ produtoId });
    return paraRespostaProdutoQuimico(produto);
  },

  async listar(container: Container, query: ListarProdutosQuimicosInput) {
    const resultado = await container.useCases.listarProdutosQuimicos.executar(query);
    return {
      data: resultado.dados.map(paraRespostaProdutoQuimico),
      meta: { page: resultado.pagina, limit: resultado.limite, total: resultado.total },
    };
  },
};
