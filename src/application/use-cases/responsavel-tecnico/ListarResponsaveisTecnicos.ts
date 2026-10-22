import type { IResponsavelTecnicoRepository } from "../../../domain/responsavel-tecnico/IResponsavelTecnicoRepository.js";
import type { ResponsavelTecnico } from "../../../domain/responsavel-tecnico/ResponsavelTecnico.js";
import type { IUseCase } from "../../IUseCase.js";

export interface ListarResponsaveisTecnicosOutput {
  readonly dados: ReadonlyArray<ResponsavelTecnico>;
}

export class ListarResponsaveisTecnicos
  implements IUseCase<Record<string, never>, ListarResponsaveisTecnicosOutput>
{
  constructor(private readonly repositorio: IResponsavelTecnicoRepository) {}

  async executar(): Promise<ListarResponsaveisTecnicosOutput> {
    const dados = await this.repositorio.listar();
    return { dados };
  }
}
