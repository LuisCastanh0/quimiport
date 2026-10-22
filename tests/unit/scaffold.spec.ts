import { describe, expect, it } from "vitest";
import { DomainError } from "../../src/shared/errors/DomainError.js";

class ErroDeTeste extends DomainError {
  constructor() {
    super({
      regra: "RN00",
      tipo: "validacao",
      codigo: "TESTE",
      mensagem: "erro de teste",
    });
  }
}

describe("scaffold", () => {
  it("permite criar um DomainError concreto com os campos esperados", () => {
    const erro = new ErroDeTeste();
    expect(erro.regra).toBe("RN00");
    expect(erro.tipo).toBe("validacao");
    expect(erro.codigo).toBe("TESTE");
    expect(erro.message).toBe("erro de teste");
  });
});
