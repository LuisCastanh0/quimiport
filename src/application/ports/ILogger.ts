export type ContextoLog = Record<string, unknown>;

/**
 * Porta de log — os casos de uso registram eventos de negócio através
 * desta porta (§9 das instruções da Fase 2); a implementação real
 * (`PinoLogger`) fica na infraestrutura.
 */
export interface ILogger {
  info(mensagem: string, contexto?: ContextoLog): void;
  warn(mensagem: string, contexto?: ContextoLog): void;
  error(mensagem: string, contexto?: ContextoLog): void;
  debug(mensagem: string, contexto?: ContextoLog): void;
}
