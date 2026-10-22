import { StatusCarga } from "./StatusCarga.js";

/**
 * RN14 — tabela de transições permitidas (exatamente 11). Qualquer outro
 * par do produto cartesiano 8x8 (64 pares, incluindo auto-transições) é
 * proibido. Esta é a única fonte de verdade sobre o fluxo de status (ver
 * `docs/diagramas/fluxo-status.md`).
 */
export interface TransicaoDefinicao {
  readonly de: StatusCarga;
  readonly para: StatusCarga;
  readonly motivoObrigatorio: boolean;
}

export const TRANSICOES_PERMITIDAS: ReadonlyArray<TransicaoDefinicao> = [
  { de: StatusCarga.Registrada, para: StatusCarga.EmAnalise, motivoObrigatorio: false },
  { de: StatusCarga.EmAnalise, para: StatusCarga.EmInspecao, motivoObrigatorio: false },
  { de: StatusCarga.EmInspecao, para: StatusCarga.Liberada, motivoObrigatorio: false },
  { de: StatusCarga.Liberada, para: StatusCarga.EmMovimentacao, motivoObrigatorio: false },
  { de: StatusCarga.EmMovimentacao, para: StatusCarga.Finalizada, motivoObrigatorio: false },
  { de: StatusCarga.Registrada, para: StatusCarga.Cancelada, motivoObrigatorio: true },
  { de: StatusCarga.EmAnalise, para: StatusCarga.Cancelada, motivoObrigatorio: true },
  { de: StatusCarga.EmInspecao, para: StatusCarga.Cancelada, motivoObrigatorio: true },
  { de: StatusCarga.Liberada, para: StatusCarga.Cancelada, motivoObrigatorio: true },
  { de: StatusCarga.Bloqueada, para: StatusCarga.Cancelada, motivoObrigatorio: true },
  { de: StatusCarga.EmInspecao, para: StatusCarga.Bloqueada, motivoObrigatorio: true },
];

function chave(de: StatusCarga, para: StatusCarga): string {
  return `${de}->${para}`;
}

const MAPA_TRANSICOES: ReadonlyMap<string, TransicaoDefinicao> = new Map(
  TRANSICOES_PERMITIDAS.map((transicao) => [chave(transicao.de, transicao.para), transicao]),
);

/** Função pura, testável isoladamente sobre os 64 pares possíveis. */
export function transicaoPermitida(de: StatusCarga, para: StatusCarga): boolean {
  return MAPA_TRANSICOES.has(chave(de, para));
}

export function buscarTransicao(de: StatusCarga, para: StatusCarga): TransicaoDefinicao | undefined {
  return MAPA_TRANSICOES.get(chave(de, para));
}
