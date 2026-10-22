import { randomUUID } from "node:crypto";
import { ProdutoQuimico } from "../../../src/domain/produto-quimico/ProdutoQuimico.js";

const AGORA_PADRAO = new Date("2026-01-01T00:00:00.000Z");

/** Builder (Object Mother) — produz um produto químico válido por padrão. */
export class ProdutoQuimicoBuilder {
  private id: string = randomUUID();
  private nome = "Ácido Sulfúrico";
  private descricao: string | undefined = "Produto de teste";
  private numeroOnu: string | undefined = "UN1830";
  private classeRisco = "8";
  private grupoCompatibilidade = "A";
  private agora = AGORA_PADRAO;
  private inativo = false;

  comId(id: string): this {
    this.id = id;
    return this;
  }

  comNome(nome: string): this {
    this.nome = nome;
    return this;
  }

  comClasseRisco(classeRisco: string): this {
    this.classeRisco = classeRisco;
    return this;
  }

  comProdutoInativo(): this {
    this.inativo = true;
    return this;
  }

  construir(): ProdutoQuimico {
    const produto = ProdutoQuimico.cadastrar({
      id: this.id,
      nome: this.nome,
      descricao: this.descricao,
      numeroOnu: this.numeroOnu,
      classeRisco: this.classeRisco,
      grupoCompatibilidade: this.grupoCompatibilidade,
      agora: this.agora,
    });
    if (this.inativo) {
      produto.inativar(this.agora);
    }
    return produto;
  }
}
