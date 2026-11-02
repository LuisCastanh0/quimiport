import { CargaQuimica } from "../../../domain/carga-quimica/CargaQuimica.js";
import { CargaQuimicaError } from "../../../domain/carga-quimica/errors/CargaQuimicaError.js";
import type { ICargaQuimicaRepository } from "../../../domain/carga-quimica/ICargaQuimicaRepository.js";
import type { IUseCase } from "../../IUseCase.js";

export interface BuscarCargaQuimicaPorIdInput {
  readonly cargaId: string;
}

export interface BuscarCargaQuimicaPorIdOutput {
  readonly carga: CargaQuimica;
}

export class BuscarCargaQuimicaPorId
  implements IUseCase<BuscarCargaQuimicaPorIdInput, BuscarCargaQuimicaPorIdOutput>
{
  constructor(private readonly repositorio: ICargaQuimicaRepository) {}

  async executar(input: BuscarCargaQuimicaPorIdInput): Promise<BuscarCargaQuimicaPorIdOutput> {
    const carga = await this.repositorio.buscarPorId(input.cargaId);
    if (!carga) {
      throw CargaQuimicaError.cargaNaoEncontrada(input.cargaId);
    }
    return { carga };
  }
}
