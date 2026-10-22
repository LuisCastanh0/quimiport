// `npm run openapi:export` — gera docs/api/openapi.json a partir do mesmo
// servidor/schemas usados em produção, sem precisar de um banco real
// (usa repositórios em memória só para montar o servidor).
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { criarContainer } from "../src/container.js";
import { InMemoryCargaQuimicaRepository } from "../src/infrastructure/persistence/in-memory/InMemoryCargaQuimicaRepository.js";
import { InMemoryProdutoQuimicoRepository } from "../src/infrastructure/persistence/in-memory/InMemoryProdutoQuimicoRepository.js";
import { InMemoryResponsavelTecnicoRepository } from "../src/infrastructure/persistence/in-memory/InMemoryResponsavelTecnicoRepository.js";
import { SystemClock } from "../src/infrastructure/system/SystemClock.js";
import { UuidGenerator } from "../src/infrastructure/system/UuidGenerator.js";
import { buildServer } from "../src/interfaces/http/server.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main(): Promise<void> {
  const container = criarContainer({
    produtoRepo: new InMemoryProdutoQuimicoRepository(),
    rtRepo: new InMemoryResponsavelTecnicoRepository(),
    cargaRepo: new InMemoryCargaQuimicaRepository(),
    clock: new SystemClock(),
    idGenerator: new UuidGenerator(),
    logger: { info() {}, warn() {}, error() {}, debug() {} },
    pingBancoDados: async () => true,
  });

  const app = await buildServer(container);
  await app.ready();

  const spec = app.swagger();
  const destino = join(__dirname, "..", "docs", "api", "openapi.json");
  await mkdir(dirname(destino), { recursive: true });
  await writeFile(destino, JSON.stringify(spec, null, 2), "utf-8");

  await app.close();
  console.log(`OpenAPI exportado para ${destino}`);
}

main().catch((erro: unknown) => {
  console.error("Falha ao exportar OpenAPI:", erro);
  process.exitCode = 1;
});
