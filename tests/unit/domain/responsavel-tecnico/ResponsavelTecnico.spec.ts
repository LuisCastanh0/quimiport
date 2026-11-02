import { describe, expect, it } from "vitest";
import { ResponsavelTecnico } from "../../../../src/domain/responsavel-tecnico/ResponsavelTecnico.js";

const AGORA = new Date("2026-01-01T00:00:00.000Z");

describe("ResponsavelTecnico", () => {
  it("cadastra responsável técnico válido", () => {
    const rt = ResponsavelTecnico.cadastrar({
      id: "rt1",
      nome: "João Souza",
      registroNumero: "CRQ-123",
      registroOrgao: "CRQ",
      especialidade: "Química industrial",
      agora: AGORA,
    });
    expect(rt.nome).toBe("João Souza");
    expect(rt.registroProfissional.numero).toBe("CRQ-123");
  });

  it("não permite cadastro sem nome", () => {
    expect(() =>
      ResponsavelTecnico.cadastrar({
        id: "rt1",
        nome: "  ",
        registroNumero: "123",
        registroOrgao: "CRQ",
        agora: AGORA,
      }),
    ).toThrowError(/nome/i);
  });

  it("não permite registro profissional sem número", () => {
    expect(() =>
      ResponsavelTecnico.cadastrar({
        id: "rt1",
        nome: "João Souza",
        registroNumero: "",
        registroOrgao: "CRQ",
        agora: AGORA,
      }),
    ).toThrowError(/registro profissional/i);
  });
});
