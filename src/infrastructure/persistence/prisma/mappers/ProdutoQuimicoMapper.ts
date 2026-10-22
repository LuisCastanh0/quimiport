import { ProdutoQuimico } from "../../../../domain/produto-quimico/ProdutoQuimico.js";
import { StatusProduto } from "../../../../domain/produto-quimico/StatusProduto.js";
import type { ProdutoQuimico as ProdutoQuimicoRow } from "../../../../../generated/prisma/client.js";

export const ProdutoQuimicoMapper = {
  paraDominio(row: ProdutoQuimicoRow): ProdutoQuimico {
    return ProdutoQuimico.reconstituir({
      id: row.id,
      nome: row.nome,
      descricao: row.descricao ?? undefined,
      numeroOnu: row.numeroOnu ?? undefined,
      classeRisco: row.classeRisco,
      grupoCompatibilidade: row.grupoCompatibilidade,
      status: row.status as StatusProduto,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  },

  paraPersistencia(produto: ProdutoQuimico) {
    return {
      nome: produto.nome,
      descricao: produto.descricao ?? null,
      numeroOnu: produto.numeroOnu ?? null,
      classeRisco: produto.classificacaoRisco.classeRisco,
      grupoCompatibilidade: produto.grupoCompatibilidade,
      status: produto.status,
    };
  },
};
