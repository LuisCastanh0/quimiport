import { CargaQuimica } from "../../../domain/carga-quimica/CargaQuimica.js";
import { CargaQuimicaError } from "../../../domain/carga-quimica/errors/CargaQuimicaError.js";
import type { ICargaQuimicaRepository } from "../../../domain/carga-quimica/ICargaQuimicaRepository.js";
import type { IUseCase } from "../../IUseCase.js";
import type { IClock } from "../../ports/IClock.js";
import type { ILogger } from "../../ports/ILogger.js";

export interface LiberarCargaQuimicaInput {
  readonly cargaId: string;
}

export interface LiberarCargaQuimicaOutput {
  readonly carga: CargaQuimica;
}

/** UC06 — Liberar carga química. */
export class LiberarCargaQuimica
  implements IUseCase<LiberarCargaQuimicaInput, LiberarCargaQuimicaOutput>
{
  constructor(
    private readonly repositorio: ICargaQuimicaRepository,
    private readonly clock: IClock,
    private readonly logger: ILogger,
  ) {}

  async executar(input: LiberarCargaQuimicaInput): Promise<LiberarCargaQuimicaOutput> {
    const carga = await this.repositorio.buscarPorId(input.cargaId);
    if (!carga) {
      throw CargaQuimicaError.cargaNaoEncontrada(input.cargaId);
    }
    carga.liberar(this.clock.agora());
    await this.repositorio.salvar(carga);
    this.logger.info("carga.liberada", { cargaId: carga.id });
    return { carga };
  }
}
