import { randomUUID } from "node:crypto";
import { CargaQuimica } from "../../../src/domain/carga-quimica/CargaQuimica.js";
import { StatusValidacaoDocumento, TipoDocumento } from "../../../src/domain/carga-quimica/DocumentoCarga.js";
import { ResultadoInspecao } from "../../../src/domain/carga-quimica/Inspecao.js";
import type { UnidadeMedida } from "../../../src/domain/carga-quimica/value-objects/Quantidade.js";
import type { ProdutoQuimico } from "../../../src/domain/produto-quimico/ProdutoQuimico.js";
import { ProdutoQuimicoBuilder } from "./ProdutoQuimicoBuilder.js";
import { ResponsavelTecnicoBuilder } from "./ResponsavelTecnicoBuilder.js";

const AGORA_PADRAO = new Date("2026-01-01T00:00:00.000Z");
const VALIDADE_FUTURA = new Date("2027-01-01T00:00:00.000Z");

type EstadoAlvo = "registrada" | "emAnalise" | "emInspecao" | "bloqueada" | "liberada";

function adicionarDocumentosObrigatoriosValidos(carga: CargaQuimica, agora: Date): void {
  for (const tipo of [
    TipoDocumento.FichaSeguranca,
    TipoDocumento.LaudoTecnico,
    TipoDocumento.LicencaTransporte,
  ]) {
    const documento = carga.adicionarDocumento({
      id: randomUUID(),
      tipo,
      numero: `DOC-${tipo}`,
      dataEmissao: agora,
      dataValidade: VALIDADE_FUTURA,
      agora,
    });
    carga.validarDocumento(documento.id, StatusValidacaoDocumento.Valido, agora);
  }
}

/**
 * Builder (Object Mother) — produz, por padrão, uma carga válida recém
 * registrada; permite customizar o produto associado e avançar o status
 * usando a própria API do agregado (garante que o estado produzido respeita
 * as regras de negócio).
 */
export class CargaQuimicaBuilder {
  private id: string = randomUUID();
  private codigo: string = `CQ-2026-${Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, "0")}`;
  private produto: ProdutoQuimico = new ProdutoQuimicoBuilder().construir();
  private responsavelTecnicoId: string = new ResponsavelTecnicoBuilder().construir().id;
  private quantidadeValor = 100;
  private unidadeMedida: UnidadeMedida = "kg";
  private origem = "Terminal A — Santos";
  private destino = "Armazém B — Santos";
  private semDocumentos = false;
  private semAceite = false;
  private estadoAlvo: EstadoAlvo = "registrada";
  private agora = AGORA_PADRAO;

  comProduto(produto: ProdutoQuimico): this {
    this.produto = produto;
    return this;
  }

  comProdutoInativo(): this {
    this.produto = new ProdutoQuimicoBuilder().comProdutoInativo().construir();
    return this;
  }

  comResponsavelTecnicoId(id: string): this {
    this.responsavelTecnicoId = id;
    return this;
  }

  comQuantidade(valor: number, unidadeMedida: UnidadeMedida = "kg"): this {
    this.quantidadeValor = valor;
    this.unidadeMedida = unidadeMedida;
    return this;
  }

  /** Avança até `EmAnalise`, sem adicionar nenhum documento. */
  semDocumentacao(): this {
    this.semDocumentos = true;
    this.estadoAlvo = "emAnalise";
    return this;
  }

  emAnalise(): this {
    this.estadoAlvo = "emAnalise";
    return this;
  }

  emInspecao(): this {
    this.estadoAlvo = "emInspecao";
    return this;
  }

  bloqueada(): this {
    this.estadoAlvo = "bloqueada";
    return this;
  }

  liberada(): this {
    this.estadoAlvo = "liberada";
    return this;
  }

  /** Avança até EmInspecao/Liberada sem registrar o aceite do RT (RN13). */
  semAceiteResponsavelTecnico(): this {
    this.semAceite = true;
    return this;
  }

  construir(): CargaQuimica {
    const carga = CargaQuimica.registrar(
      {
        id: this.id,
        codigo: this.codigo,
        produtoQuimicoId: this.produto.id,
        quantidade: { valor: this.quantidadeValor, unidadeMedida: this.unidadeMedida },
        origem: this.origem,
        destino: this.destino,
        responsavelTecnicoId: this.responsavelTecnicoId,
        agora: this.agora,
      },
      this.produto,
    );

    if (this.estadoAlvo === "registrada") {
      return carga;
    }

    if (!this.semDocumentos) {
      adicionarDocumentosObrigatoriosValidos(carga, this.agora);
    }
    carga.iniciarAnalise(this.agora);
    if (this.estadoAlvo === "emAnalise") {
      return carga;
    }

    carga.enviarParaInspecao(this.agora);
    if (!this.semAceite) {
      carga.registrarAceiteResponsavelTecnico(this.responsavelTecnicoId, this.agora);
    }
    if (this.estadoAlvo === "emInspecao") {
      return carga;
    }

    if (this.estadoAlvo === "bloqueada") {
      carga.bloquear("Motivo de teste", this.agora);
      return carga;
    }

    carga.registrarInspecao({
      id: randomUUID(),
      dataInspecao: this.agora,
      inspetorResponsavel: "Inspetor de Teste",
      resultado: ResultadoInspecao.Aprovada,
      agora: this.agora,
    });
    carga.liberar(this.agora);
    return carga;
  }
}
