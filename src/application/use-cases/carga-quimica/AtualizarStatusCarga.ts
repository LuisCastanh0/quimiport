import { CargaQuimica } from "../../../domain/carga-quimica/CargaQuimica.js";
import { CargaQuimicaError } from "../../../domain/carga-quimica/errors/CargaQuimicaError.js";
import type { ICargaQuimicaRepository } from "../../../domain/carga-quimica/ICargaQuimicaRepository.js";
import { StatusCarga } from "../../../domain/carga-quimica/StatusCarga.js";
import type { IUseCase } from "../../IUseCase.js";
import type { IClock } from "../../ports/IClock.js";
import type { ILogger } from "../../ports/ILogger.js";

export interface AtualizarStatusCargaInput {
  readonly cargaId: string;
  readonly status: StatusCarga;
  readonly motivo?: string;
}

export interface AtualizarStatusCargaOutput {
  readonly carga: CargaQuimica;
}

/**
 * UC08 — Atualizar status da carga. Endpoint genérico `PATCH
 * /cargas-quimicas/:id/status`; chama o mesmo `transicionarPara` usado
 * pelos endpoints dedicados (liberar/bloquear/cancelar), garantindo que
 * não haja regra duplicada entre os dois caminhos.
 */
export class AtualizarStatusCarga
  implements IUseCase<AtualizarStatusCargaInput, AtualizarStatusCargaOutput>
{
  constructor(
    private readonly repositorio: ICargaQuimicaRepository,
    private readonly clock: IClock,
    private readonly logger: ILogger,
  ) {}

  async executar(input: AtualizarStatusCargaInput): Promise<AtualizarStatusCargaOutput> {
    const carga = await this.repositorio.buscarPorId(input.cargaId);
    if (!carga) {
      throw CargaQuimicaError.cargaNaoEncontrada(input.cargaId);
    }
    const statusAnterior = carga.status;
    carga.transicionarPara(input.status, { motivo: input.motivo, agora: this.clock.agora() });
    await this.repositorio.salvar(carga);
    this.logger.info("carga.status_alterado", {
      cargaId: carga.id,
      de: statusAnterior,
      para: carga.status,
    });
    return { carga };
  }
}
