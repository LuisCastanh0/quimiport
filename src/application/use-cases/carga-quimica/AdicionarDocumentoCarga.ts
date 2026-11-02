import { CargaQuimicaError } from "../../../domain/carga-quimica/errors/CargaQuimicaError.js";
import { DocumentoCarga, TipoDocumento } from "../../../domain/carga-quimica/DocumentoCarga.js";
import type { ICargaQuimicaRepository } from "../../../domain/carga-quimica/ICargaQuimicaRepository.js";
import type { IUseCase } from "../../IUseCase.js";
import type { IClock } from "../../ports/IClock.js";
import type { IIdGenerator } from "../../ports/IIdGenerator.js";
import type { ILogger } from "../../ports/ILogger.js";

export interface AdicionarDocumentoCargaInput {
  readonly cargaId: string;
  readonly tipo: TipoDocumento;
  readonly numero: string;
  readonly dataEmissao: string;
  readonly dataValidade: string;
}

export interface AdicionarDocumentoCargaOutput {
  readonly documento: DocumentoCarga;
}

/** UC04 — Validar documentação da carga (etapa 1: anexar documento). */
export class AdicionarDocumentoCarga
  implements IUseCase<AdicionarDocumentoCargaInput, AdicionarDocumentoCargaOutput>
{
  constructor(
    private readonly repositorio: ICargaQuimicaRepository,
    private readonly clock: IClock,
    private readonly idGenerator: IIdGenerator,
    private readonly logger: ILogger,
  ) {}

  async executar(input: AdicionarDocumentoCargaInput): Promise<AdicionarDocumentoCargaOutput> {
    const carga = await this.repositorio.buscarPorId(input.cargaId);
    if (!carga) {
      throw CargaQuimicaError.cargaNaoEncontrada(input.cargaId);
    }
    const documento = carga.adicionarDocumento({
      id: this.idGenerator.gerar(),
      tipo: input.tipo,
      numero: input.numero,
      dataEmissao: new Date(input.dataEmissao),
      dataValidade: new Date(input.dataValidade),
      agora: this.clock.agora(),
    });
    await this.repositorio.salvar(carga);
    this.logger.info("carga.documento_adicionado", { cargaId: carga.id, tipo: input.tipo });
    return { documento };
  }
}
