import { InMemoryCargaQuimicaRepository } from "../../../src/infrastructure/persistence/in-memory/InMemoryCargaQuimicaRepository.js";
import { testarContratoCargaQuimicaRepository } from "./carga-quimica-repository.contract.js";

testarContratoCargaQuimicaRepository("InMemoryCargaQuimicaRepository", () => new InMemoryCargaQuimicaRepository());
