import { criarPrismaClient } from "../../src/infrastructure/persistence/prisma/client.js";
import type { PrismaClient } from "../../src/infrastructure/persistence/prisma/client.js";

/**
 * Suporte a testes de integração contra PostgreSQL real. Local:
 * `docker compose up -d db` + `DATABASE_URL_TEST`; CI: service container
 * (ver §12.1 das instruções da Fase 2). Quando `DATABASE_URL_TEST` não
 * está definida (ex.: ambiente sem Postgres disponível), os specs que
 * dependem disto devem usar `describe.skipIf(!bancoDeTesteDisponivel())`.
 */
export function bancoDeTesteDisponivel(): boolean {
  return Boolean(process.env.DATABASE_URL_TEST);
}

let clienteCompartilhado: PrismaClient | undefined;

export function obterPrismaClientDeTeste(): PrismaClient {
  if (!clienteCompartilhado) {
    const url = process.env.DATABASE_URL_TEST;
    if (!url) {
      throw new Error("DATABASE_URL_TEST não configurada — chame bancoDeTesteDisponivel() antes.");
    }
    clienteCompartilhado = criarPrismaClient(url);
  }
  return clienteCompartilhado;
}

/** Limpa todas as tabelas de domínio entre testes (ordem respeita FKs). */
export async function truncarTabelas(prisma: PrismaClient): Promise<void> {
  await prisma.$transaction([
    prisma.historicoStatusCarga.deleteMany(),
    prisma.inspecao.deleteMany(),
    prisma.documentoCarga.deleteMany(),
    prisma.cargaQuimica.deleteMany(),
    prisma.responsavelTecnico.deleteMany(),
    prisma.produtoQuimico.deleteMany(),
    prisma.areaArmazenamento.deleteMany(),
  ]);
}
