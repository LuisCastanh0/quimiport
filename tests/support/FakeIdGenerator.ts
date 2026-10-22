import type { IIdGenerator } from "../../src/application/ports/IIdGenerator.js";

/** Gera ids previsíveis e sequenciais, úteis para asserções em teste. */
export class FakeIdGenerator implements IIdGenerator {
  private contador = 0;

  gerar(): string {
    this.contador += 1;
    return `id-teste-${this.contador}`;
  }
}
