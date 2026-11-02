/**
 * Status da Carga Química — 8 estados (Fase 2, ver ADR-13 em
 * `docs/decisoes-arquiteturais.md`, que substitui o modelo de 6 estados da
 * Fase 1). Único lugar da base de código onde esses literais são definidos.
 */
export enum StatusCarga {
  Registrada = "Registrada",
  EmAnalise = "EmAnalise",
  EmInspecao = "EmInspecao",
  Liberada = "Liberada",
  Bloqueada = "Bloqueada",
  EmMovimentacao = "EmMovimentacao",
  Finalizada = "Finalizada",
  Cancelada = "Cancelada",
}

export const TODOS_STATUS_CARGA: ReadonlyArray<StatusCarga> = Object.values(StatusCarga);

/** RN15 — Finalizada e Cancelada são os únicos estados terminais. */
export const STATUS_TERMINAIS: ReadonlySet<StatusCarga> = new Set([
  StatusCarga.Finalizada,
  StatusCarga.Cancelada,
]);

export function ehStatusTerminal(status: StatusCarga): boolean {
  return STATUS_TERMINAIS.has(status);
}
