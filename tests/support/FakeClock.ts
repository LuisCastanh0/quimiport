import type { IClock } from "../../src/application/ports/IClock.js";

export class FakeClock implements IClock {
  constructor(private data: Date = new Date("2026-01-01T00:00:00.000Z")) {}

  agora(): Date {
    return this.data;
  }

  avancar(ms: number): void {
    this.data = new Date(this.data.getTime() + ms);
  }

  definir(data: Date): void {
    this.data = data;
  }
}
