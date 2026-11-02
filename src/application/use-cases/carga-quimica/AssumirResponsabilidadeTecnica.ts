import { CargaQuimica } from "../../../domain/carga-quimica/CargaQuimica.js";
import { CargaQuimicaError } from "../../../domain/carga-quimica/errors/CargaQuimicaError.js";
import type { ICargaQuimicaRepository } from "../../../domain/carga-quimica/ICargaQuimicaRepository.js";
import type { IUseCase } from "../../IUseCase.js";
import type { IClock } from "../../ports/IClock.js";
import type { ILogger } from "../../ports/ILogger.js";

export interface AssumirResponsabilidadeTecnicaInput {
  readonly cargaId: string;
  readonly responsavelTecnicoId: string;
}

export interface AssumirResponsabilidadeTecnicaOutput {
  readonly carga: CargaQuimica;
}

/** UC12 — Assumir responsabilidade técnica pela carga. */
export class AssumirResponsabilidadeTecnica
  implements IUseCase<AssumirResponsabilidadeTecnicaInput, AssumirResponsabilidadeTecnicaOutput>
{
  constructor(
    private readonly repositorio: ICargaQuimicaRepository,
    private readonly clock: IClock,
    private readonly logger: ILogger,
  ) {}

  async executar(
    input: AssumirResponsabilidadeTecnicaInput,
  ): Promise<AssumirResponsabilidadeTecnicaOutput> {
    const carga = await this.repositorio.buscarPorId(input.cargaId);
    if (!carga) {
      throw CargaQuimicaError.cargaNaoEncontrada(input.cargaId);
    }
    carga.registrarAceiteResponsavelTecnico(input.responsavelTecnicoId, this.clock.agora());
    await this.repositorio.salvar(carga);
    this.logger.info("carga.aceite_responsavel_tecnico_registrado", {
      cargaId: carga.id,
      responsavelTecnicoId: input.responsavelTecnicoId,
    });
    return { carga };
  }
}
