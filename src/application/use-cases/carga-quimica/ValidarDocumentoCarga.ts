import { CargaQuimicaError } from "../../../domain/carga-quimica/errors/CargaQuimicaError.js";
import { DocumentoCarga, StatusValidacaoDocumento } from "../../../domain/carga-quimica/DocumentoCarga.js";
import type { ICargaQuimicaRepository } from "../../../domain/carga-quimica/ICargaQuimicaRepository.js";
import type { IUseCase } from "../../IUseCase.js";
import type { IClock } from "../../ports/IClock.js";
import type { ILogger } from "../../ports/ILogger.js";

export interface ValidarDocumentoCargaInput {
  readonly cargaId: string;
  readonly documentoId: string;
  readonly status: StatusValidacaoDocumento;
}

export interface ValidarDocumentoCargaOutput {
  readonly documento: DocumentoCarga;
}

/** UC04 — Validar documentação da carga (etapa 2: validar/invalidar). */
export class ValidarDocumentoCarga
  implements IUseCase<ValidarDocumentoCargaInput, ValidarDocumentoCargaOutput>
{
  constructor(
    private readonly repositorio: ICargaQuimicaRepository,
    private readonly clock: IClock,
    private readonly logger: ILogger,
  ) {}

  async executar(input: ValidarDocumentoCargaInput): Promise<ValidarDocumentoCargaOutput> {
    const carga = await this.repositorio.buscarPorId(input.cargaId);
    if (!carga) {
      throw CargaQuimicaError.cargaNaoEncontrada(input.cargaId);
    }
    const documento = carga.validarDocumento(input.documentoId, input.status, this.clock.agora());
    await this.repositorio.salvar(carga);
    this.logger.info("carga.documento_validado", {
      cargaId: carga.id,
      documentoId: input.documentoId,
      status: input.status,
    });
    return { documento };
  }
}
