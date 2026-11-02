import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../../../generated/prisma/client.js";

/**
 * Cliente Prisma confinado à infraestrutura (ADR-11) — nenhuma outra
 * camada importa `@prisma/client`/`PrismaClient` diretamente. Prisma 7
 * exige um *driver adapter* explícito (`@prisma/adapter-pg`) em vez de ler
 * a `DATABASE_URL` do `schema.prisma`.
 */
export function criarPrismaClient(databaseUrl: string): PrismaClient {
  const adapter = new PrismaPg({ connectionString: databaseUrl });
  return new PrismaClient({ adapter });
}

export type { PrismaClient };
