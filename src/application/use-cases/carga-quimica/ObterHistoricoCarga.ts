import { CargaQuimicaError } from "../../../domain/carga-quimica/errors/CargaQuimicaError.js";
import type { HistoricoStatusEntry } from "../../../domain/carga-quimica/CargaQuimica.js";
import type { ICargaQuimicaRepository } from "../../../domain/carga-quimica/ICargaQuimicaRepository.js";
import type { IUseCase } from "../../IUseCase.js";

export interface ObterHistoricoCargaInput {
  readonly cargaId: string;
}

export interface ObterHistoricoCargaOutput {
  readonly historico: ReadonlyArray<HistoricoStatusEntry>;
}

/** UC11 — Consultar histórico da carga. */
export class ObterHistoricoCarga
  implements IUseCase<ObterHistoricoCargaInput, ObterHistoricoCargaOutput>
{
  constructor(private readonly repositorio: ICargaQuimicaRepository) {}

  async executar(input: ObterHistoricoCargaInput): Promise<ObterHistoricoCargaOutput> {
    const carga = await this.repositorio.buscarPorId(input.cargaId);
    if (!carga) {
      throw CargaQuimicaError.cargaNaoEncontrada(input.cargaId);
    }
    return { historico: carga.historicoStatus };
  }
}
