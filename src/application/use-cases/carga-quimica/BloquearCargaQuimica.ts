import { CargaQuimica } from "../../../domain/carga-quimica/CargaQuimica.js";
import { CargaQuimicaError } from "../../../domain/carga-quimica/errors/CargaQuimicaError.js";
import type { ICargaQuimicaRepository } from "../../../domain/carga-quimica/ICargaQuimicaRepository.js";
import type { IUseCase } from "../../IUseCase.js";
import type { IClock } from "../../ports/IClock.js";
import type { ILogger } from "../../ports/ILogger.js";

export interface BloquearCargaQuimicaInput {
  readonly cargaId: string;
  readonly motivo: string;
}

export interface BloquearCargaQuimicaOutput {
  readonly carga: CargaQuimica;
}

/** UC07 — Bloquear carga química (manual, Gestor Operacional). */
export class BloquearCargaQuimica
  implements IUseCase<BloquearCargaQuimicaInput, BloquearCargaQuimicaOutput>
{
  constructor(
    private readonly repositorio: ICargaQuimicaRepository,
    private readonly clock: IClock,
    private readonly logger: ILogger,
  ) {}

  async executar(input: BloquearCargaQuimicaInput): Promise<BloquearCargaQuimicaOutput> {
    const carga = await this.repositorio.buscarPorId(input.cargaId);
    if (!carga) {
      throw CargaQuimicaError.cargaNaoEncontrada(input.cargaId);
    }
    carga.bloquear(input.motivo, this.clock.agora());
    await this.repositorio.salvar(carga);
    this.logger.warn("carga.bloqueada", { cargaId: carga.id, motivo: input.motivo });
    return { carga };
  }
}
