import { describe, expect, it } from "vitest";
import { Quantidade } from "../../../../src/domain/carga-quimica/value-objects/Quantidade.js";
import { ClassificacaoRisco } from "../../../../src/domain/carga-quimica/value-objects/ClassificacaoRisco.js";
import {
  criarPeriodoValidade,
  periodoValidoEm,
} from "../../../../src/domain/carga-quimica/value-objects/PeriodoValidade.js";

describe("Quantidade (RN11)", () => {
  it("cria quantidade válida quando valor > 0", () => {
    const quantidade = Quantidade.criar(10, "kg");
    expect(quantidade.valor).toBe(10);
    expect(quantidade.unidadeMedida).toBe("kg");
  });

  it.each([0, -1, -100.5])("rejeita quantidade %s (deve ser maior que zero)", (valor) => {
    expect(() => Quantidade.criar(valor, "kg")).toThrowError(/maior que zero/);
  });

  it("rejeita unidade de medida desconhecida", () => {
    // @ts-expect-error -- testando entrada inválida de runtime
    expect(() => Quantidade.criar(10, "m3")).toThrow();
  });
});

describe("ClassificacaoRisco (RN03/RN09)", () => {
  it.each(["1", "2", "3", "4", "5", "6", "7", "8", "9"])(
    "aceita classe de risco ONU válida: %s",
    (classe) => {
      expect(() => ClassificacaoRisco.criar(classe)).not.toThrow();
    },
  );

  it("deriva a categoriaPerigo a partir da classe (Fase 2)", () => {
    const classificacao = ClassificacaoRisco.criar("3");
    expect(classificacao.categoriaPerigo).toBe("Líquidos inflamáveis");
  });

  it("rejeita classe de risco fora do intervalo 1-9", () => {
    expect(() => ClassificacaoRisco.criar("10")).toThrow(/inválida/);
    expect(() => ClassificacaoRisco.criar("")).toThrow();
  });
});

describe("PeriodoValidade (RN17)", () => {
  it("considera válido um período cuja validade ainda não venceu", () => {
    const periodo = criarPeriodoValidade(
      new Date("2026-01-01T00:00:00Z"),
      new Date("2026-06-01T00:00:00Z"),
    );
    expect(periodoValidoEm(periodo, new Date("2026-03-01T00:00:00Z"))).toBe(true);
  });

  it("considera inválido (vencido) um período cuja validade já passou", () => {
    const periodo = criarPeriodoValidade(
      new Date("2026-01-01T00:00:00Z"),
      new Date("2026-02-01T00:00:00Z"),
    );
    expect(periodoValidoEm(periodo, new Date("2026-03-01T00:00:00Z"))).toBe(false);
  });

  it("rejeita data de validade anterior à data de emissão", () => {
    expect(() =>
      criarPeriodoValidade(new Date("2026-06-01T00:00:00Z"), new Date("2026-01-01T00:00:00Z")),
    ).toThrow(/anterior/);
  });
});
