import { CargaQuimica } from "../../../domain/carga-quimica/CargaQuimica.js";
import { CargaQuimicaError } from "../../../domain/carga-quimica/errors/CargaQuimicaError.js";
import type { ICargaQuimicaRepository } from "../../../domain/carga-quimica/ICargaQuimicaRepository.js";
import type { IUseCase } from "../../IUseCase.js";
import type { IClock } from "../../ports/IClock.js";
import type { ILogger } from "../../ports/ILogger.js";

export interface CancelarCargaQuimicaInput {
  readonly cargaId: string;
  readonly motivo: string;
}

export interface CancelarCargaQuimicaOutput {
  readonly carga: CargaQuimica;
}

/** UC09 — Cancelar carga química. */
export class CancelarCargaQuimica
  implements IUseCase<CancelarCargaQuimicaInput, CancelarCargaQuimicaOutput>
{
  constructor(
    private readonly repositorio: ICargaQuimicaRepository,
    private readonly clock: IClock,
    private readonly logger: ILogger,
  ) {}

  async executar(input: CancelarCargaQuimicaInput): Promise<CancelarCargaQuimicaOutput> {
    const carga = await this.repositorio.buscarPorId(input.cargaId);
    if (!carga) {
      throw CargaQuimicaError.cargaNaoEncontrada(input.cargaId);
    }
    carga.cancelar(input.motivo, this.clock.agora());
    await this.repositorio.salvar(carga);
    this.logger.warn("carga.cancelada", { cargaId: carga.id, motivo: input.motivo });
    return { carga };
  }
}
