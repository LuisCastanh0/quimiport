import "dotenv/config";
import pino from "pino";
import { criarContainer } from "./container.js";
import { carregarEnv } from "./infrastructure/config/env.js";
import { PinoLogger } from "./infrastructure/logging/PinoLogger.js";
import { criarPrismaClient } from "./infrastructure/persistence/prisma/client.js";
import { PrismaCargaQuimicaRepository } from "./infrastructure/persistence/prisma/repositories/PrismaCargaQuimicaRepository.js";
import { PrismaProdutoQuimicoRepository } from "./infrastructure/persistence/prisma/repositories/PrismaProdutoQuimicoRepository.js";
import { PrismaResponsavelTecnicoRepository } from "./infrastructure/persistence/prisma/repositories/PrismaResponsavelTecnicoRepository.js";
import { SystemClock } from "./infrastructure/system/SystemClock.js";
import { UuidGenerator } from "./infrastructure/system/UuidGenerator.js";
import { buildServer } from "./interfaces/http/server.js";

async function main(): Promise<void> {
  const env = carregarEnv();

  const pinoInstance = pino({
    level: env.LOG_LEVEL,
    transport: env.NODE_ENV === "development" ? { target: "pino-pretty" } : undefined,
    redact: ["req.headers.authorization", "req.headers.cookie"],
  });
  const logger = new PinoLogger(pinoInstance);

  const prisma = criarPrismaClient(env.DATABASE_URL);

  const container = criarContainer({
    produtoRepo: new PrismaProdutoQuimicoRepository(prisma),
    rtRepo: new PrismaResponsavelTecnicoRepository(prisma),
    cargaRepo: new PrismaCargaQuimicaRepository(prisma),
    clock: new SystemClock(),
    idGenerator: new UuidGenerator(),
    logger,
    pingBancoDados: async () => {
      try {
        await prisma.$queryRaw`SELECT 1`;
        return true;
      } catch {
        return false;
      }
    },
  });

  const app = await buildServer(container, { loggerInstance: pinoInstance });

  const encerrar = async (): Promise<void> => {
    await app.close();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on("SIGINT", encerrar);
  process.on("SIGTERM", encerrar);

  await app.listen({ host: env.HOST, port: env.PORT });
  logger.info("servidor.iniciado", { host: env.HOST, port: env.PORT });
}

main().catch((erro: unknown) => {
  console.error("Falha ao iniciar o servidor:", erro);
  process.exitCode = 1;
});
