import type { IIdGenerator } from "../../src/application/ports/IIdGenerator.js";

/**
 * Gera ids previsíveis e sequenciais, no formato UUID (necessário porque
 * os schemas Zod de resposta HTTP exigem `.uuid()` — ver §7 das
 * instruções da Fase 2), úteis para asserções em teste.
 */
export class FakeIdGenerator implements IIdGenerator {
  private contador = 0;

  gerar(): string {
    this.contador += 1;
    const sufixo = this.contador.toString().padStart(12, "0");
    return `00000000-0000-4000-8000-${sufixo}`;
  }
}
