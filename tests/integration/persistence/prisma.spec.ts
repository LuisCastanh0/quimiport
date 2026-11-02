import { afterAll, afterEach, beforeAll, describe } from "vitest";
import { PrismaCargaQuimicaRepository } from "../../../src/infrastructure/persistence/prisma/repositories/PrismaCargaQuimicaRepository.js";
import { PrismaProdutoQuimicoRepository } from "../../../src/infrastructure/persistence/prisma/repositories/PrismaProdutoQuimicoRepository.js";
import { PrismaResponsavelTecnicoRepository } from "../../../src/infrastructure/persistence/prisma/repositories/PrismaResponsavelTecnicoRepository.js";
import type { PrismaClient } from "../../../src/infrastructure/persistence/prisma/client.js";
import { ProdutoQuimicoBuilder } from "../../support/builders/ProdutoQuimicoBuilder.js";
import { ResponsavelTecnicoBuilder } from "../../support/builders/ResponsavelTecnicoBuilder.js";
import { bancoDeTesteDisponivel, obterPrismaClientDeTeste, truncarTabelas } from "../../support/setup-db.js";
import { testarContratoCargaQuimicaRepository } from "./carga-quimica-repository.contract.js";

/**
 * Só roda com um PostgreSQL de teste disponível (`DATABASE_URL_TEST`):
 * localmente via `docker compose up -d db`, no CI via service container.
 * Neste ambiente de desenvolvimento (sem Docker/Postgres acessível), este
 * describe é pulado — ver relatório final do agente para o que foi
 * verificado apenas por revisão de código.
 */
describe.skipIf(!bancoDeTesteDisponivel())("Persistência Prisma (PostgreSQL)", () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    prisma = obterPrismaClientDeTeste();
  });

  afterEach(async () => {
    await truncarTabelas(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  testarContratoCargaQuimicaRepository(
    "PrismaCargaQuimicaRepository",
    () => new PrismaCargaQuimicaRepository(prisma),
    {
      async antesDeSalvarNovaCarga(carga) {
        const produtoRepo = new PrismaProdutoQuimicoRepository(prisma);
        const rtRepo = new PrismaResponsavelTecnicoRepository(prisma);
        await produtoRepo.salvar(new ProdutoQuimicoBuilder().comId(carga.produtoQuimicoId).construir());
        await rtRepo.salvar(
          new ResponsavelTecnicoBuilder().comId(carga.responsavelTecnicoId).construir(),
        );
      },
    },
  );
});
