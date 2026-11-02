import type { ContextoLog, ILogger } from "../../src/application/ports/ILogger.js";

export interface RegistroDeLog {
  nivel: "info" | "warn" | "error" | "debug";
  mensagem: string;
  contexto?: ContextoLog;
}

/** Spy simples — permite inspecionar quais eventos de negócio foram logados. */
export class FakeLogger implements ILogger {
  readonly registros: RegistroDeLog[] = [];

  info(mensagem: string, contexto?: ContextoLog): void {
    this.registros.push({ nivel: "info", mensagem, contexto });
  }

  warn(mensagem: string, contexto?: ContextoLog): void {
    this.registros.push({ nivel: "warn", mensagem, contexto });
  }

  error(mensagem: string, contexto?: ContextoLog): void {
    this.registros.push({ nivel: "error", mensagem, contexto });
  }

  debug(mensagem: string, contexto?: ContextoLog): void {
    this.registros.push({ nivel: "debug", mensagem, contexto });
  }
}
