import { randomUUID } from "node:crypto";
import { ResponsavelTecnico } from "../../../src/domain/responsavel-tecnico/ResponsavelTecnico.js";

const AGORA_PADRAO = new Date("2026-01-01T00:00:00.000Z");

export class ResponsavelTecnicoBuilder {
  private id: string = randomUUID();
  private nome = "Maria Silva";
  private registroNumero = "12345";
  private registroOrgao = "CRQ";
  private especialidade: string | undefined = "Engenharia Química";
  private agora = AGORA_PADRAO;

  comId(id: string): this {
    this.id = id;
    return this;
  }

  comNome(nome: string): this {
    this.nome = nome;
    return this;
  }

  construir(): ResponsavelTecnico {
    return ResponsavelTecnico.cadastrar({
      id: this.id,
      nome: this.nome,
      registroNumero: this.registroNumero,
      registroOrgao: this.registroOrgao,
      especialidade: this.especialidade,
      agora: this.agora,
    });
  }
}
