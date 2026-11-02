import type { FastifyInstance } from "fastify";
import { criarContainer, type Container } from "../../src/container.js";
import { InMemoryCargaQuimicaRepository } from "../../src/infrastructure/persistence/in-memory/InMemoryCargaQuimicaRepository.js";
import { InMemoryProdutoQuimicoRepository } from "../../src/infrastructure/persistence/in-memory/InMemoryProdutoQuimicoRepository.js";
import { InMemoryResponsavelTecnicoRepository } from "../../src/infrastructure/persistence/in-memory/InMemoryResponsavelTecnicoRepository.js";
import { buildServer } from "../../src/interfaces/http/server.js";
import { FakeClock } from "./FakeClock.js";
import { FakeIdGenerator } from "./FakeIdGenerator.js";
import { FakeLogger } from "./FakeLogger.js";

export interface TestServerContext {
  app: FastifyInstance;
  container: Container;
  clock: FakeClock;
  logger: FakeLogger;
}

/** Monta `buildServer` com repositórios em memória — usado pelos testes HTTP. */
export async function criarServidorDeTeste(): Promise<TestServerContext> {
  const clock = new FakeClock();
  const logger = new FakeLogger();
  const container = criarContainer({
    produtoRepo: new InMemoryProdutoQuimicoRepository(),
    rtRepo: new InMemoryResponsavelTecnicoRepository(),
    cargaRepo: new InMemoryCargaQuimicaRepository(),
    clock,
    idGenerator: new FakeIdGenerator(),
    logger,
    pingBancoDados: async () => true,
  });
  const app = await buildServer(container);
  await app.ready();
  return { app, container, clock, logger };
}
