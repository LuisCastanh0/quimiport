import type { Logger } from "pino";
import type { ContextoLog, ILogger } from "../../application/ports/ILogger.js";

/** Adapter pino para a porta `ILogger` — usado pelos casos de uso para eventos de negócio. */
export class PinoLogger implements ILogger {
  constructor(private readonly pino: Logger) {}

  info(mensagem: string, contexto?: ContextoLog): void {
    this.pino.info({ ...contexto, evento: mensagem }, mensagem);
  }

  warn(mensagem: string, contexto?: ContextoLog): void {
    this.pino.warn({ ...contexto, evento: mensagem }, mensagem);
  }

  error(mensagem: string, contexto?: ContextoLog): void {
    this.pino.error({ ...contexto, evento: mensagem }, mensagem);
  }

  debug(mensagem: string, contexto?: ContextoLog): void {
    this.pino.debug({ ...contexto, evento: mensagem }, mensagem);
  }
}
