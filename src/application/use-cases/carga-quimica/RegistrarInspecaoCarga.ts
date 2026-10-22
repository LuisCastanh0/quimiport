import { CargaQuimicaError } from "../../../domain/carga-quimica/errors/CargaQuimicaError.js";
import { Inspecao, ResultadoInspecao } from "../../../domain/carga-quimica/Inspecao.js";
import type { ICargaQuimicaRepository } from "../../../domain/carga-quimica/ICargaQuimicaRepository.js";
import type { IUseCase } from "../../IUseCase.js";
import type { IClock } from "../../ports/IClock.js";
import type { IIdGenerator } from "../../ports/IIdGenerator.js";
import type { ILogger } from "../../ports/ILogger.js";

export interface RegistrarInspecaoCargaInput {
  readonly cargaId: string;
  readonly dataInspecao: string;
  readonly inspetorResponsavel: string;
  readonly resultado: ResultadoInspecao;
  readonly parecer?: string;
}

export interface RegistrarInspecaoCargaOutput {
  readonly inspecao: Inspecao;
}

/** UC05 — Solicitar/registrar inspeção. */
export class RegistrarInspecaoCarga
  implements IUseCase<RegistrarInspecaoCargaInput, RegistrarInspecaoCargaOutput>
{
  constructor(
    private readonly repositorio: ICargaQuimicaRepository,
    private readonly clock: IClock,
    private readonly idGenerator: IIdGenerator,
    private readonly logger: ILogger,
  ) {}

  async executar(input: RegistrarInspecaoCargaInput): Promise<RegistrarInspecaoCargaOutput> {
    const carga = await this.repositorio.buscarPorId(input.cargaId);
    if (!carga) {
      throw CargaQuimicaError.cargaNaoEncontrada(input.cargaId);
    }
    const inspecao = carga.registrarInspecao({
      id: this.idGenerator.gerar(),
      dataInspecao: new Date(input.dataInspecao),
      inspetorResponsavel: input.inspetorResponsavel,
      resultado: input.resultado,
      parecer: input.parecer,
      agora: this.clock.agora(),
    });
    await this.repositorio.salvar(carga);
    this.logger.info("carga.inspecao_registrada", {
      cargaId: carga.id,
      resultado: inspecao.resultado,
    });
    if (inspecao.resultado === ResultadoInspecao.Reprovada) {
      this.logger.warn("carga.bloqueada", { cargaId: carga.id, motivo: "Inspeção reprovada" });
    }
    return { inspecao };
  }
}
