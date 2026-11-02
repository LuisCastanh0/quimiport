import { ResponsavelTecnicoError } from "../../../domain/responsavel-tecnico/errors/ResponsavelTecnicoError.js";
import type { IResponsavelTecnicoRepository } from "../../../domain/responsavel-tecnico/IResponsavelTecnicoRepository.js";
import type { ResponsavelTecnico } from "../../../domain/responsavel-tecnico/ResponsavelTecnico.js";
import type { IUseCase } from "../../IUseCase.js";

export interface BuscarResponsavelTecnicoPorIdInput {
  readonly responsavelTecnicoId: string;
}

export interface BuscarResponsavelTecnicoPorIdOutput {
  readonly responsavelTecnico: ResponsavelTecnico;
}

export class BuscarResponsavelTecnicoPorId
  implements IUseCase<BuscarResponsavelTecnicoPorIdInput, BuscarResponsavelTecnicoPorIdOutput>
{
  constructor(private readonly repositorio: IResponsavelTecnicoRepository) {}

  async executar(
    input: BuscarResponsavelTecnicoPorIdInput,
  ): Promise<BuscarResponsavelTecnicoPorIdOutput> {
    const responsavelTecnico = await this.repositorio.buscarPorId(input.responsavelTecnicoId);
    if (!responsavelTecnico) {
      throw ResponsavelTecnicoError.naoEncontrado(input.responsavelTecnicoId);
    }
    return { responsavelTecnico };
  }
}
