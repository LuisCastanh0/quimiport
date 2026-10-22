import { ResponsavelTecnico } from "../../../domain/responsavel-tecnico/ResponsavelTecnico.js";
import type { IResponsavelTecnicoRepository } from "../../../domain/responsavel-tecnico/IResponsavelTecnicoRepository.js";
import type { IUseCase } from "../../IUseCase.js";
import type { IClock } from "../../ports/IClock.js";
import type { IIdGenerator } from "../../ports/IIdGenerator.js";
import type { ILogger } from "../../ports/ILogger.js";

export interface CadastrarResponsavelTecnicoInput {
  readonly nome: string;
  readonly registroNumero: string;
  readonly registroOrgao: string;
  readonly especialidade?: string;
}

export interface CadastrarResponsavelTecnicoOutput {
  readonly responsavelTecnico: ResponsavelTecnico;
}

/** Suporte a RN12 — cadastro do responsável técnico vinculável à carga. */
export class CadastrarResponsavelTecnico
  implements IUseCase<CadastrarResponsavelTecnicoInput, CadastrarResponsavelTecnicoOutput>
{
  constructor(
    private readonly repositorio: IResponsavelTecnicoRepository,
    private readonly clock: IClock,
    private readonly idGenerator: IIdGenerator,
    private readonly logger: ILogger,
  ) {}

  async executar(
    input: CadastrarResponsavelTecnicoInput,
  ): Promise<CadastrarResponsavelTecnicoOutput> {
    const responsavelTecnico = ResponsavelTecnico.cadastrar({
      id: this.idGenerator.gerar(),
      nome: input.nome,
      registroNumero: input.registroNumero,
      registroOrgao: input.registroOrgao,
      especialidade: input.especialidade,
      agora: this.clock.agora(),
    });
    await this.repositorio.salvar(responsavelTecnico);
    this.logger.info("responsavel_tecnico.cadastrado", { responsavelTecnicoId: responsavelTecnico.id });
    return { responsavelTecnico };
  }
}
