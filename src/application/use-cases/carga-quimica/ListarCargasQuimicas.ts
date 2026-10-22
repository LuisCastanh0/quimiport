import { CargaQuimica } from "../../../domain/carga-quimica/CargaQuimica.js";
import type { FiltroCargaQuimica, ICargaQuimicaRepository } from "../../../domain/carga-quimica/ICargaQuimicaRepository.js";
import type { IUseCase } from "../../IUseCase.js";

export type ListarCargasQuimicasInput = FiltroCargaQuimica;

export interface ListarCargasQuimicasOutput {
  readonly dados: ReadonlyArray<CargaQuimica>;
  readonly total: number;
  readonly pagina: number;
  readonly limite: number;
}

/** UC10 — Consultar cargas por status. */
export class ListarCargasQuimicas
  implements IUseCase<ListarCargasQuimicasInput, ListarCargasQuimicasOutput>
{
  constructor(private readonly repositorio: ICargaQuimicaRepository) {}

  async executar(input: ListarCargasQuimicasInput): Promise<ListarCargasQuimicasOutput> {
    const pagina = input.pagina ?? 1;
    const limite = input.limite ?? 20;
    const resultado = await this.repositorio.listar({ ...input, pagina, limite });
    return { dados: resultado.dados, total: resultado.total, pagina, limite };
  }
}
