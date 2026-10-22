import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { CargaQuimica } from "../../../../src/domain/carga-quimica/CargaQuimica.js";
import { StatusValidacaoDocumento, TipoDocumento } from "../../../../src/domain/carga-quimica/DocumentoCarga.js";
import { ResultadoInspecao } from "../../../../src/domain/carga-quimica/Inspecao.js";
import { StatusCarga } from "../../../../src/domain/carga-quimica/StatusCarga.js";
import { CargaQuimicaBuilder } from "../../../support/builders/CargaQuimicaBuilder.js";
import { ProdutoQuimicoBuilder } from "../../../support/builders/ProdutoQuimicoBuilder.js";
import { ResponsavelTecnicoBuilder } from "../../../support/builders/ResponsavelTecnicoBuilder.js";

const AGORA = new Date("2026-01-01T00:00:00.000Z");
const VALIDADE_FUTURA = new Date("2027-01-01T00:00:00.000Z");
const VALIDADE_VENCIDA = new Date("2025-01-01T00:00:00.000Z");

function inputBasico(overrides: Partial<Parameters<typeof CargaQuimica.registrar>[0]> = {}) {
  const rt = new ResponsavelTecnicoBuilder().construir();
  return {
    id: randomUUID(),
    codigo: `CQ-2026-${Math.floor(Math.random() * 1_000_000)}`,
    produtoQuimicoId: "produto-1",
    quantidade: { valor: 10, unidadeMedida: "kg" as const },
    origem: "Terminal A",
    destino: "Armazém B",
    responsavelTecnicoId: rt.id,
    agora: AGORA,
    ...overrides,
  };
}

describe("CargaQuimica.registrar", () => {
  it("registra carga válida com status inicial Registrada", () => {
    const produto = new ProdutoQuimicoBuilder().construir();
    const carga = CargaQuimica.registrar(inputBasico({ produtoQuimicoId: produto.id }), produto);
    expect(carga.status).toBe(StatusCarga.Registrada);
    expect(carga.historicoStatus).toHaveLength(1);
    expect(carga.historicoStatus[0]?.statusAnterior).toBeNull();
    expect(carga.historicoStatus[0]?.statusNovo).toBe(StatusCarga.Registrada);
  });

  it("RN02/RN10 — não permite registro com produto inativo (422/regra)", () => {
    const produto = new ProdutoQuimicoBuilder().comProdutoInativo().construir();
    expect(() => CargaQuimica.registrar(inputBasico({ produtoQuimicoId: produto.id }), produto)).toThrowError(
      /inativo/i,
    );
    try {
      CargaQuimica.registrar(inputBasico({ produtoQuimicoId: produto.id }), produto);
    } catch (erro) {
      expect((erro as { regra: string }).regra).toBe("RN02");
      expect((erro as { tipo: string }).tipo).toBe("regra");
    }
  });

  it("RN03 — usa a classificação de risco do produto quando não informada", () => {
    const produto = new ProdutoQuimicoBuilder().comClasseRisco("5").construir();
    const carga = CargaQuimica.registrar(inputBasico({ produtoQuimicoId: produto.id }), produto);
    expect(carga.classificacaoRisco.classeRisco).toBe("5");
  });

  it.each([0, -5])("RN11 — rejeita quantidade %s (deve ser maior que zero)", (valor) => {
    const produto = new ProdutoQuimicoBuilder().construir();
    expect(() =>
      CargaQuimica.registrar(
        inputBasico({ produtoQuimicoId: produto.id, quantidade: { valor, unidadeMedida: "kg" } }),
        produto,
      ),
    ).toThrowError(/maior que zero/);
  });

  it("RN12 — não permite registro sem responsável técnico informado", () => {
    const produto = new ProdutoQuimicoBuilder().construir();
    expect(() =>
      CargaQuimica.registrar(
        inputBasico({ produtoQuimicoId: produto.id, responsavelTecnicoId: "  " }),
        produto,
      ),
    ).toThrowError(/responsável técnico/i);
  });

  it("exige origem e destino", () => {
    const produto = new ProdutoQuimicoBuilder().construir();
    expect(() =>
      CargaQuimica.registrar(inputBasico({ produtoQuimicoId: produto.id, origem: "" }), produto),
    ).toThrow();
    expect(() =>
      CargaQuimica.registrar(inputBasico({ produtoQuimicoId: produto.id, destino: "" }), produto),
    ).toThrow();
  });
});

describe("CargaQuimica — fluxo feliz completo (Registrada -> Finalizada)", () => {
  it("percorre Registrada -> EmAnalise -> EmInspecao -> Liberada -> EmMovimentacao -> Finalizada", () => {
    const carga = new CargaQuimicaBuilder().construir();

    carga.adicionarDocumento({
      id: randomUUID(),
      tipo: TipoDocumento.FichaSeguranca,
      numero: "FS-1",
      dataEmissao: AGORA,
      dataValidade: VALIDADE_FUTURA,
      agora: AGORA,
    });
    carga.adicionarDocumento({
      id: randomUUID(),
      tipo: TipoDocumento.LaudoTecnico,
      numero: "LT-1",
      dataEmissao: AGORA,
      dataValidade: VALIDADE_FUTURA,
      agora: AGORA,
    });
    const licenca = carga.adicionarDocumento({
      id: randomUUID(),
      tipo: TipoDocumento.LicencaTransporte,
      numero: "LIC-1",
      dataEmissao: AGORA,
      dataValidade: VALIDADE_FUTURA,
      agora: AGORA,
    });
    for (const documento of carga.documentos) {
      carga.validarDocumento(documento.id, StatusValidacaoDocumento.Valido, AGORA);
    }
    expect(licenca.statusValidacao).toBeDefined();

    carga.iniciarAnalise(AGORA);
    expect(carga.status).toBe(StatusCarga.EmAnalise);

    carga.enviarParaInspecao(AGORA);
    expect(carga.status).toBe(StatusCarga.EmInspecao);

    carga.registrarAceiteResponsavelTecnico(carga.responsavelTecnicoId, AGORA);
    expect(carga.aceiteResponsavelTecnico).toEqual(AGORA);

    carga.registrarInspecao({
      id: randomUUID(),
      dataInspecao: AGORA,
      inspetorResponsavel: "Inspetor X",
      resultado: ResultadoInspecao.Aprovada,
      agora: AGORA,
    });

    carga.liberar(AGORA);
    expect(carga.status).toBe(StatusCarga.Liberada);

    carga.iniciarMovimentacao(AGORA);
    expect(carga.status).toBe(StatusCarga.EmMovimentacao);

    carga.finalizar(AGORA);
    expect(carga.status).toBe(StatusCarga.Finalizada);

    expect(carga.historicoStatus).toHaveLength(6);
  });
});

describe("CargaQuimica — RN04/RN17 documentação obrigatória", () => {
  it("não permite avançar para EmInspecao sem documentação obrigatória", () => {
    const carga = new CargaQuimicaBuilder().semDocumentacao().construir();
    expect(() => carga.enviarParaInspecao(AGORA)).toThrowError(/documentação/i);
  });

  it("não permite avançar para EmInspecao com documento vencido", () => {
    const carga = new CargaQuimicaBuilder().semDocumentacao().construir();
    const docVencido = carga.adicionarDocumento({
      id: randomUUID(),
      tipo: TipoDocumento.FichaSeguranca,
      numero: "venceu",
      dataEmissao: new Date("2024-01-01"),
      dataValidade: VALIDADE_VENCIDA,
      agora: AGORA,
    });
    carga.validarDocumento(docVencido.id, StatusValidacaoDocumento.Valido, AGORA);
    carga.adicionarDocumento({
      id: randomUUID(),
      tipo: TipoDocumento.LaudoTecnico,
      numero: "lt",
      dataEmissao: AGORA,
      dataValidade: VALIDADE_FUTURA,
      agora: AGORA,
    });
    carga.adicionarDocumento({
      id: randomUUID(),
      tipo: TipoDocumento.LicencaTransporte,
      numero: "lic",
      dataEmissao: AGORA,
      dataValidade: VALIDADE_FUTURA,
      agora: AGORA,
    });
    expect(() => carga.enviarParaInspecao(AGORA)).toThrowError(/documentação/i);
  });

  it("não permite liberar sem inspeção aprovada (RN07)", () => {
    const carga = new CargaQuimicaBuilder().emInspecao().construir();
    expect(() => carga.liberar(AGORA)).toThrowError(/inspeção/i);
  });

  it("não permite liberar sem aceite do responsável técnico (RN13)", () => {
    const produto = new ProdutoQuimicoBuilder().construir();
    const rt = new ResponsavelTecnicoBuilder().construir();
    const carga = new CargaQuimicaBuilder()
      .comProduto(produto)
      .comResponsavelTecnicoId(rt.id)
      .semAceiteResponsavelTecnico()
      .emInspecao()
      .construir();
    carga.registrarInspecao({
      id: randomUUID(),
      dataInspecao: AGORA,
      inspetorResponsavel: "Inspetor Y",
      resultado: ResultadoInspecao.Aprovada,
      agora: AGORA,
    });
    expect(() => carga.liberar(AGORA)).toThrowError(/aceite/i);
  });
});

describe("CargaQuimica — RN05/RN06/RN14 transições proibidas", () => {
  it("RN05 — carga bloqueada não pode entrar em movimentação", () => {
    const carga = new CargaQuimicaBuilder().bloqueada().construir();
    expect(() => carga.iniciarMovimentacao(AGORA)).toThrowError(/não é permitida/);
  });

  it("RN06 — carga cancelada não pode ser liberada", () => {
    const carga = new CargaQuimicaBuilder().construir();
    carga.cancelar("Desistência do operador", AGORA);
    expect(() => carga.liberar(AGORA)).toThrowError();
  });

  it("transição inválida (não terminal) carrega regra RN14 e código TRANSICAO_INVALIDA", () => {
    const carga = new CargaQuimicaBuilder().construir();
    try {
      carga.liberar(AGORA); // Registrada -> Liberada não está na tabela.
      expect.unreachable();
    } catch (erro) {
      expect((erro as { regra: string }).regra).toBe("RN14");
      expect((erro as { codigo: string }).codigo).toBe("TRANSICAO_INVALIDA");
    }
  });
});

describe("CargaQuimica — RN15 estados terminais são imutáveis", () => {
  it("carga Cancelada não aceita nenhuma transição adicional", () => {
    const carga = new CargaQuimicaBuilder().construir();
    carga.cancelar("Motivo", AGORA);
    expect(carga.status).toBe(StatusCarga.Cancelada);
    expect(() => carga.iniciarAnalise(AGORA)).toThrowError(/terminal/i);
  });

  it("carga Finalizada (fim do fluxo feliz) não aceita nenhuma transição adicional", () => {
    const carga = new CargaQuimicaBuilder().liberada().construir();
    carga.iniciarMovimentacao(AGORA);
    carga.finalizar(AGORA);
    expect(carga.status).toBe(StatusCarga.Finalizada);
    expect(() => carga.cancelar("Motivo", AGORA)).toThrowError(/terminal/i);
  });

  it("não permite nenhuma mudança (status, documento, inspeção, aceite) em carga Cancelada", () => {
    const carga = new CargaQuimicaBuilder().construir();
    carga.cancelar("Motivo", AGORA);

    expect(() => carga.iniciarAnalise(AGORA)).toThrowError(/terminal/i);
    expect(() =>
      carga.adicionarDocumento({
        id: randomUUID(),
        tipo: TipoDocumento.FichaSeguranca,
        numero: "x",
        dataEmissao: AGORA,
        dataValidade: VALIDADE_FUTURA,
        agora: AGORA,
      }),
    ).toThrowError(/terminal/i);
    expect(() =>
      carga.registrarInspecao({
        id: randomUUID(),
        dataInspecao: AGORA,
        inspetorResponsavel: "X",
        resultado: ResultadoInspecao.Aprovada,
        agora: AGORA,
      }),
    ).toThrowError(/terminal/i);
    expect(() => carga.registrarAceiteResponsavelTecnico(carga.responsavelTecnicoId, AGORA)).toThrowError(
      /terminal/i,
    );
  });
});

describe("CargaQuimica — cancelamento (UC09)", () => {
  const construtores: ReadonlyArray<[string, () => CargaQuimica]> = [
    ["Registrada", () => new CargaQuimicaBuilder().construir()],
    ["EmAnalise", () => new CargaQuimicaBuilder().emAnalise().construir()],
    ["EmInspecao", () => new CargaQuimicaBuilder().emInspecao().construir()],
    ["Liberada", () => new CargaQuimicaBuilder().liberada().construir()],
    ["Bloqueada", () => new CargaQuimicaBuilder().bloqueada().construir()],
  ];

  it.each(construtores)("permite cancelar a partir de %s", (_nome, construir) => {
    const carga = construir();
    expect(() => carga.cancelar("Motivo do cancelamento", AGORA)).not.toThrow();
    expect(carga.status).toBe(StatusCarga.Cancelada);
  });

  it("exige motivo para cancelar", () => {
    const carga = new CargaQuimicaBuilder().construir();
    expect(() => carga.cancelar("", AGORA)).toThrowError(/motivo/i);
  });
});

describe("CargaQuimica — UC07 bloqueio só a partir de EmInspecao (RN14)", () => {
  it("rejeita bloqueio a partir de Registrada", () => {
    const carga = new CargaQuimicaBuilder().construir();
    expect(() => carga.bloquear("Motivo", AGORA)).toThrowError(/não é permitida/);
  });

  it("permite bloqueio a partir de EmInspecao", () => {
    const carga = new CargaQuimicaBuilder().emInspecao().construir();
    carga.bloquear("Risco identificado", AGORA);
    expect(carga.status).toBe(StatusCarga.Bloqueada);
  });
});

describe("CargaQuimica — inspeção reprovada bloqueia automaticamente (UC05/UC07)", () => {
  it("resultado Reprovada move a carga para Bloqueada", () => {
    const carga = new CargaQuimicaBuilder().emInspecao().construir();
    carga.registrarInspecao({
      id: randomUUID(),
      dataInspecao: AGORA,
      inspetorResponsavel: "Inspetor Z",
      resultado: ResultadoInspecao.Reprovada,
      agora: AGORA,
    });
    expect(carga.status).toBe(StatusCarga.Bloqueada);
    expect(carga.historicoStatus.at(-1)?.motivo).toMatch(/reprovada/i);
  });
});

describe("CargaQuimica — documentos (UC04)", () => {
  it("rejeita documento duplicado do mesmo tipo (conflito)", () => {
    const carga = new CargaQuimicaBuilder().construir();
    carga.adicionarDocumento({
      id: randomUUID(),
      tipo: TipoDocumento.FichaSeguranca,
      numero: "1",
      dataEmissao: AGORA,
      dataValidade: VALIDADE_FUTURA,
      agora: AGORA,
    });
    expect(() =>
      carga.adicionarDocumento({
        id: randomUUID(),
        tipo: TipoDocumento.FichaSeguranca,
        numero: "2",
        dataEmissao: AGORA,
        dataValidade: VALIDADE_FUTURA,
        agora: AGORA,
      }),
    ).toThrowError(/já existe/i);
  });

  it("404 lógico ao validar documento inexistente", () => {
    const carga = new CargaQuimicaBuilder().construir();
    expect(() =>
      carga.validarDocumento("documento-inexistente", StatusValidacaoDocumento.Valido, AGORA),
    ).toThrowError(/não encontrado/i);
  });

  it("não permite adicionar documento em carga Liberada", () => {
    const carga = new CargaQuimicaBuilder().liberada().construir();
    expect(() =>
      carga.adicionarDocumento({
        id: randomUUID(),
        tipo: TipoDocumento.FichaSeguranca,
        numero: "x",
        dataEmissao: AGORA,
        dataValidade: VALIDADE_FUTURA,
        agora: AGORA,
      }),
    ).toThrowError(/não é possível/i);
  });
});

describe("CargaQuimica — aceite do responsável técnico (UC12, RN13)", () => {
  it("registra aceite quando o RT corresponde ao vinculado", () => {
    const carga = new CargaQuimicaBuilder().construir();
    carga.registrarAceiteResponsavelTecnico(carga.responsavelTecnicoId, AGORA);
    expect(carga.aceiteResponsavelTecnico).toEqual(AGORA);
  });

  it("rejeita aceite de RT diferente do vinculado (regra/422)", () => {
    const carga = new CargaQuimicaBuilder().construir();
    expect(() => carga.registrarAceiteResponsavelTecnico("outro-rt", AGORA)).toThrowError(
      /vinculado/i,
    );
  });

  it("rejeita aceite duplicado (409)", () => {
    const carga = new CargaQuimicaBuilder().construir();
    carga.registrarAceiteResponsavelTecnico(carga.responsavelTecnicoId, AGORA);
    expect(() => carga.registrarAceiteResponsavelTecnico(carga.responsavelTecnicoId, AGORA)).toThrowError(
      /já foi registrado/i,
    );
  });
});

describe("CargaQuimica — versão e atualização (optimistic locking)", () => {
  it("incrementa a versão a cada mutação", () => {
    const carga = new CargaQuimicaBuilder().construir();
    const versaoInicial = carga.version;
    carga.iniciarAnalise(AGORA);
    expect(carga.version).toBe(versaoInicial + 1);
  });
});
