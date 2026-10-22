import { ProdutoQuimicoError } from "../../../../domain/produto-quimico/errors/ProdutoQuimicoError.js";
import type {
  FiltroProdutoQuimico,
  IProdutoQuimicoRepository,
  ResultadoListaProdutoQuimico,
} from "../../../../domain/produto-quimico/IProdutoQuimicoRepository.js";
import type { ProdutoQuimico } from "../../../../domain/produto-quimico/ProdutoQuimico.js";
import type { PrismaClient } from "../client.js";
import { ProdutoQuimicoMapper } from "../mappers/ProdutoQuimicoMapper.js";

function isUniqueConstraintError(erro: unknown): boolean {
  return Boolean(
    erro && typeof erro === "object" && "code" in erro && (erro as { code: unknown }).code === "P2002",
  );
}

export class PrismaProdutoQuimicoRepository implements IProdutoQuimicoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async salvar(produto: ProdutoQuimico): Promise<void> {
    const dados = ProdutoQuimicoMapper.paraPersistencia(produto);
    try {
      await this.prisma.produtoQuimico.upsert({
        where: { id: produto.id },
        create: { id: produto.id, ...dados },
        update: dados,
      });
    } catch (erro) {
      if (isUniqueConstraintError(erro)) {
        throw ProdutoQuimicoError.nomeDuplicado(produto.nome);
      }
      throw erro;
    }
  }

  async buscarPorId(id: string): Promise<ProdutoQuimico | null> {
    const row = await this.prisma.produtoQuimico.findUnique({ where: { id } });
    return row ? ProdutoQuimicoMapper.paraDominio(row) : null;
  }

  async buscarPorNome(nome: string): Promise<ProdutoQuimico | null> {
    const row = await this.prisma.produtoQuimico.findFirst({
      where: { nome: { equals: nome, mode: "insensitive" } },
    });
    return row ? ProdutoQuimicoMapper.paraDominio(row) : null;
  }

  async listar(filtro: FiltroProdutoQuimico): Promise<ResultadoListaProdutoQuimico> {
    const where = {
      ...(filtro.status ? { status: filtro.status } : {}),
      ...(filtro.classeRisco ? { classeRisco: filtro.classeRisco } : {}),
      ...(filtro.nome ? { nome: { contains: filtro.nome, mode: "insensitive" as const } } : {}),
    };
    const pagina = filtro.pagina ?? 1;
    const limite = filtro.limite ?? 20;
    const [linhas, total] = await Promise.all([
      this.prisma.produtoQuimico.findMany({
        where,
        skip: (pagina - 1) * limite,
        take: limite,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.produtoQuimico.count({ where }),
    ]);
    return { dados: linhas.map(ProdutoQuimicoMapper.paraDominio), total };
  }
}
