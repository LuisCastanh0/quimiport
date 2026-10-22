import type { ProdutoQuimico } from "../produto-quimico/ProdutoQuimico.js";
import { CargaQuimicaError } from "./errors/CargaQuimicaError.js";
import { DocumentoCarga, StatusValidacaoDocumento, TipoDocumento } from "./DocumentoCarga.js";
import { Inspecao, ResultadoInspecao } from "./Inspecao.js";
import { documentacaoObrigatoriaValida, inspecaoMaisRecenteAprovada } from "./regras.js";
import { ehStatusTerminal, StatusCarga } from "./StatusCarga.js";
import { buscarTransicao } from "./transicoes.js";
import { ClassificacaoRisco } from "./value-objects/ClassificacaoRisco.js";
import { criarPeriodoValidade, type PeriodoValidade } from "./value-objects/PeriodoValidade.js";
import { Quantidade, type UnidadeMedida } from "./value-objects/Quantidade.js";

/** Status em que documentos/inspeção/aceite ainda podem ser editados. */
const STATUS_DOCUMENTO_EDITAVEL: ReadonlySet<StatusCarga> = new Set([
  StatusCarga.Registrada,
  StatusCarga.EmAnalise,
  StatusCarga.EmInspecao,
]);

const STATUS_ACEITE_PERMITIDO: ReadonlySet<StatusCarga> = STATUS_DOCUMENTO_EDITAVEL;

export interface HistoricoStatusEntry {
  readonly statusAnterior: StatusCarga | null;
  readonly statusNovo: StatusCarga;
  readonly motivo: string | undefined;
  readonly ocorridoEm: Date;
}

export interface RegistrarCargaQuimicaParams {
  id: string;
  codigo: string;
  produtoQuimicoId: string;
  quantidade: { valor: number; unidadeMedida: UnidadeMedida };
  origem: string;
  destino: string;
  responsavelTecnicoId: string;
  classeRisco?: string;
  dataEntrada?: Date;
  agora: Date;
}

/**
 * Raiz de agregado (Fase 1, `dominio.md` §5). Concentra as regras RN01–RN17
 * e é o único lugar da base de código que muta `status`
 * (`transicionarPara`). `DocumentoCarga` e `Inspecao` são entidades
 * internas, só acessadas através deste agregado.
 */
export class CargaQuimica {
  private _quantidade: Quantidade;
  private _classificacaoRisco: ClassificacaoRisco;
  private _origem: string;
  private _destino: string;
  private _status: StatusCarga;
  private _aceiteResponsavelTecnico: Date | undefined;
  private readonly _documentos: DocumentoCarga[];
  private readonly _inspecoes: Inspecao[];
  private readonly _historicoStatus: HistoricoStatusEntry[];
  private _version: number;
  private _updatedAt: Date;

  private constructor(
    readonly id: string,
    readonly codigo: string,
    readonly produtoQuimicoId: string,
    quantidade: Quantidade,
    classificacaoRisco: ClassificacaoRisco,
    origem: string,
    destino: string,
    readonly responsavelTecnicoId: string,
    readonly dataEntrada: Date,
    status: StatusCarga,
    aceiteResponsavelTecnico: Date | undefined,
    documentos: DocumentoCarga[],
    inspecoes: Inspecao[],
    historicoStatus: HistoricoStatusEntry[],
    version: number,
    readonly createdAt: Date,
    updatedAt: Date,
  ) {
    this._quantidade = quantidade;
    this._classificacaoRisco = classificacaoRisco;
    this._origem = origem;
    this._destino = destino;
    this._status = status;
    this._aceiteResponsavelTecnico = aceiteResponsavelTecnico;
    this._documentos = documentos;
    this._inspecoes = inspecoes;
    this._historicoStatus = historicoStatus;
    this._version = version;
    this._updatedAt = updatedAt;
  }

  /**
   * RN01 (produto associado), RN02/RN10 (produto ativo), RN03
   * (classificação de risco, default = a do produto), RN11 (quantidade >
   * 0), RN12 (responsável técnico informado). `produto` já deve ter sido
   * localizado pelo caso de uso (404 se não encontrado é responsabilidade
   * do caso de uso, não desta fábrica).
   */
  static registrar(params: RegistrarCargaQuimicaParams, produto: ProdutoQuimico): CargaQuimica {
    if (!produto.podeSerUsadoEmNovaCarga()) {
      throw CargaQuimicaError.produtoInativo();
    }
    if (!params.responsavelTecnicoId?.trim()) {
      throw CargaQuimicaError.responsavelTecnicoNaoInformado();
    }
    const origem = params.origem?.trim();
    if (!origem) {
      throw CargaQuimicaError.campoObrigatorioAusente("origem", "Origem é obrigatória.");
    }
    const destino = params.destino?.trim();
    if (!destino) {
      throw CargaQuimicaError.campoObrigatorioAusente("destino", "Destino é obrigatório.");
    }
    const quantidade = Quantidade.criar(
      params.quantidade.valor,
      params.quantidade.unidadeMedida,
    );
    const classificacaoRisco = params.classeRisco
      ? ClassificacaoRisco.criar(params.classeRisco)
      : produto.classificacaoRisco;

    return new CargaQuimica(
      params.id,
      params.codigo,
      params.produtoQuimicoId,
      quantidade,
      classificacaoRisco,
      origem,
      destino,
      params.responsavelTecnicoId,
      params.dataEntrada ?? params.agora,
      StatusCarga.Registrada,
      undefined,
      [],
      [],
      [{ statusAnterior: null, statusNovo: StatusCarga.Registrada, motivo: undefined, ocorridoEm: params.agora }],
      0,
      params.agora,
      params.agora,
    );
  }

  /** Reconstrução a partir da persistência — não reaplica regras de criação. */
  static reconstituir(params: {
    id: string;
    codigo: string;
    produtoQuimicoId: string;
    quantidade: { valor: number; unidadeMedida: UnidadeMedida };
    classeRisco: string;
    origem: string;
    destino: string;
    responsavelTecnicoId: string;
    dataEntrada: Date;
    status: StatusCarga;
    aceiteResponsavelTecnico: Date | undefined;
    documentos: DocumentoCarga[];
    inspecoes: Inspecao[];
    historicoStatus: HistoricoStatusEntry[];
    version: number;
    createdAt: Date;
    updatedAt: Date;
  }): CargaQuimica {
    return new CargaQuimica(
      params.id,
      params.codigo,
      params.produtoQuimicoId,
      Quantidade.criar(params.quantidade.valor, params.quantidade.unidadeMedida),
      ClassificacaoRisco.criar(params.classeRisco),
      params.origem,
      params.destino,
      params.responsavelTecnicoId,
      params.dataEntrada,
      params.status,
      params.aceiteResponsavelTecnico,
      params.documentos,
      params.inspecoes,
      params.historicoStatus,
      params.version,
      params.createdAt,
      params.updatedAt,
    );
  }

  get quantidade(): Quantidade {
    return this._quantidade;
  }

  get classificacaoRisco(): ClassificacaoRisco {
    return this._classificacaoRisco;
  }

  get origem(): string {
    return this._origem;
  }

  get destino(): string {
    return this._destino;
  }

  get status(): StatusCarga {
    return this._status;
  }

  get aceiteResponsavelTecnico(): Date | undefined {
    return this._aceiteResponsavelTecnico;
  }

  get documentos(): ReadonlyArray<DocumentoCarga> {
    return this._documentos;
  }

  get inspecoes(): ReadonlyArray<Inspecao> {
    return this._inspecoes;
  }

  get historicoStatus(): ReadonlyArray<HistoricoStatusEntry> {
    return this._historicoStatus;
  }

  get version(): number {
    return this._version;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // ---- Transição de status (RN14/RN15) -----------------------------------

  /**
   * Único ponto de mutação de `status`. Valida a tabela de transições
   * (RN14), o motivo obrigatório para as transições que o exigem, o gate
   * específico do destino e, por fim, registra o histórico.
   */
  transicionarPara(destino: StatusCarga, contexto: { motivo?: string; agora: Date }): void {
    this.assertNaoTerminal();
    const transicao = buscarTransicao(this._status, destino);
    if (!transicao) {
      throw CargaQuimicaError.transicaoInvalida(this._status, destino);
    }
    if (transicao.motivoObrigatorio && !contexto.motivo?.trim()) {
      throw CargaQuimicaError.motivoObrigatorio();
    }
    this.verificarGateDestino(destino, contexto.agora);

    this._historicoStatus.push({
      statusAnterior: this._status,
      statusNovo: destino,
      motivo: contexto.motivo?.trim(),
      ocorridoEm: contexto.agora,
    });
    this._status = destino;
    this._updatedAt = contexto.agora;
    this._version += 1;
  }

  iniciarAnalise(agora: Date): void {
    this.transicionarPara(StatusCarga.EmAnalise, { agora });
  }

  enviarParaInspecao(agora: Date): void {
    this.transicionarPara(StatusCarga.EmInspecao, { agora });
  }

  liberar(agora: Date): void {
    this.transicionarPara(StatusCarga.Liberada, { agora });
  }

  iniciarMovimentacao(agora: Date): void {
    this.transicionarPara(StatusCarga.EmMovimentacao, { agora });
  }

  finalizar(agora: Date): void {
    this.transicionarPara(StatusCarga.Finalizada, { agora });
  }

  bloquear(motivo: string, agora: Date): void {
    this.transicionarPara(StatusCarga.Bloqueada, { motivo, agora });
  }

  cancelar(motivo: string, agora: Date): void {
    this.transicionarPara(StatusCarga.Cancelada, { motivo, agora });
  }

  private assertNaoTerminal(): void {
    if (ehStatusTerminal(this._status)) {
      throw CargaQuimicaError.terminalImutavel(this._status);
    }
  }

  private verificarGateDestino(destino: StatusCarga, agora: Date): void {
    if (destino === StatusCarga.EmInspecao || destino === StatusCarga.Liberada) {
      // RN04/RN17 — documentação obrigatória completa, válida e não vencida.
      if (!documentacaoObrigatoriaValida(this._documentos, agora)) {
        throw CargaQuimicaError.documentacaoInvalida();
      }
    }
    if (destino === StatusCarga.Liberada) {
      // RN07 — inspeção mais recente aprovada.
      if (!inspecaoMaisRecenteAprovada(this._inspecoes)) {
        throw CargaQuimicaError.inspecaoNaoAprovada();
      }
      // RN13 — aceite formal do responsável técnico.
      if (!this._aceiteResponsavelTecnico) {
        throw CargaQuimicaError.aceiteResponsavelTecnicoNaoRegistrado();
      }
    }
  }

  // ---- Documentos (UC04) --------------------------------------------------

  private assertDocumentoEditavel(operacao: string): void {
    this.assertNaoTerminal();
    if (!STATUS_DOCUMENTO_EDITAVEL.has(this._status)) {
      throw CargaQuimicaError.operacaoNaoPermitidaNoStatusAtual(this._status, operacao);
    }
  }

  adicionarDocumento(params: {
    id: string;
    tipo: TipoDocumento;
    numero: string;
    dataEmissao: Date;
    dataValidade: Date;
    agora: Date;
  }): DocumentoCarga {
    this.assertDocumentoEditavel("adicionar documento");
    if (this._documentos.some((documento) => documento.tipo === params.tipo)) {
      throw CargaQuimicaError.documentoDuplicado(params.tipo);
    }
    const periodoValidade: PeriodoValidade = criarPeriodoValidade(
      params.dataEmissao,
      params.dataValidade,
    );
    const documento = DocumentoCarga.registrar({
      id: params.id,
      tipo: params.tipo,
      numero: params.numero,
      periodoValidade,
      agora: params.agora,
    });
    this._documentos.push(documento);
    this._updatedAt = params.agora;
    this._version += 1;
    return documento;
  }

  validarDocumento(
    documentoId: string,
    status: StatusValidacaoDocumento,
    agora: Date,
  ): DocumentoCarga {
    this.assertDocumentoEditavel("validar documento");
    const documento = this._documentos.find((item) => item.id === documentoId);
    if (!documento) {
      throw CargaQuimicaError.documentoNaoEncontrado(documentoId);
    }
    documento.atualizarValidacao(status, agora);
    this._updatedAt = agora;
    this._version += 1;
    return documento;
  }

  // ---- Inspeção (UC05) ----------------------------------------------------

  registrarInspecao(params: {
    id: string;
    dataInspecao: Date;
    inspetorResponsavel: string;
    resultado: ResultadoInspecao;
    parecer?: string;
    agora: Date;
  }): Inspecao {
    this.assertNaoTerminal();
    if (this._status !== StatusCarga.EmInspecao) {
      throw CargaQuimicaError.operacaoNaoPermitidaNoStatusAtual(this._status, "registrar inspeção");
    }
    const inspecao = Inspecao.registrar({
      id: params.id,
      dataInspecao: params.dataInspecao,
      inspetorResponsavel: params.inspetorResponsavel,
      resultado: params.resultado,
      parecer: params.parecer,
      agora: params.agora,
    });
    this._inspecoes.push(inspecao);
    this._updatedAt = params.agora;
    this._version += 1;

    // UC05/UC07 — inspeção reprovada aciona bloqueio automático.
    if (inspecao.resultado === ResultadoInspecao.Reprovada) {
      this.bloquear("Inspeção reprovada", params.agora);
    }
    return inspecao;
  }

  // ---- Aceite do Responsável Técnico (UC12) -------------------------------

  registrarAceiteResponsavelTecnico(responsavelTecnicoId: string, agora: Date): void {
    this.assertNaoTerminal();
    if (!STATUS_ACEITE_PERMITIDO.has(this._status)) {
      throw CargaQuimicaError.operacaoNaoPermitidaNoStatusAtual(
        this._status,
        "registrar aceite do responsável técnico",
      );
    }
    if (responsavelTecnicoId !== this.responsavelTecnicoId) {
      throw CargaQuimicaError.responsavelTecnicoNaoVinculado();
    }
    if (this._aceiteResponsavelTecnico) {
      throw CargaQuimicaError.aceiteResponsavelTecnicoJaRegistrado();
    }
    this._aceiteResponsavelTecnico = agora;
    this._updatedAt = agora;
    this._version += 1;
  }
}
