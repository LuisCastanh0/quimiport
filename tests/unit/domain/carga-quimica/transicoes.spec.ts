import { describe, expect, it } from "vitest";
import {
  StatusCarga,
  TODOS_STATUS_CARGA,
} from "../../../../src/domain/carga-quimica/StatusCarga.js";
import {
  TRANSICOES_PERMITIDAS,
  transicaoPermitida,
} from "../../../../src/domain/carga-quimica/transicoes.js";

const TODOS_OS_PARES = TODOS_STATUS_CARGA.flatMap((de) =>
  TODOS_STATUS_CARGA.map((para) => [de, para] as const),
);

const CHAVES_PERMITIDAS = new Set(
  TRANSICOES_PERMITIDAS.map((transicao) => `${transicao.de}->${transicao.para}`),
);

describe("RN14 — tabela de transições de status (matriz 8x8)", () => {
  it("define exatamente 11 transições permitidas", () => {
    expect(TRANSICOES_PERMITIDAS).toHaveLength(11);
  });

  it("tem 64 pares possíveis no total (8 estados)", () => {
    expect(TODOS_OS_PARES).toHaveLength(64);
  });

  it.each(TODOS_OS_PARES)("de %s para %s", (de, para) => {
    const permitida = CHAVES_PERMITIDAS.has(`${de}->${para}`);
    expect(transicaoPermitida(de, para)).toBe(permitida);
  });

  it("rejeita toda auto-transição (nenhum estado transiciona para si mesmo)", () => {
    for (const status of TODOS_STATUS_CARGA) {
      expect(transicaoPermitida(status, status)).toBe(false);
    }
  });

  it.each([
    [StatusCarga.Cancelada, StatusCarga.Liberada],
    [StatusCarga.Finalizada, StatusCarga.EmMovimentacao],
    [StatusCarga.Bloqueada, StatusCarga.EmMovimentacao],
    [StatusCarga.Registrada, StatusCarga.Finalizada],
    [StatusCarga.EmInspecao, StatusCarga.Finalizada],
    [StatusCarga.Liberada, StatusCarga.Registrada],
  ])("rejeita explicitamente %s -> %s", (de, para) => {
    expect(transicaoPermitida(de, para)).toBe(false);
  });
});
