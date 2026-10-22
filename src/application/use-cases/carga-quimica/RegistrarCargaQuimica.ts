import { CargaQuimica } from "../../../domain/carga-quimica/CargaQuimica.js";
import { CargaQuimicaError } from "../../../domain/carga-quimica/errors/CargaQuimicaError.js";
import { TipoDocumento } from "../../../domain/carga-quimica/DocumentoCarga.js";
import type { ICargaQuimicaRepository } from "../../../domain/carga-quimica/ICargaQuimicaRepository.js";
import type { UnidadeMedida } from "../../../domain/carga-quimica/value-objects/Quantidade.js";
import { ProdutoQuimicoError } from "../../../domain/produto-quimico/errors/ProdutoQuimicoError.js";
import type { IProdutoQuimicoRepository } from "../../../domain/produto-quimico/IProdutoQuimicoRepository.js";
import { ResponsavelTecnicoError } from "../../../domain/responsavel-tecnico/errors/ResponsavelTecnicoError.js";
import type { IResponsavelTecnicoRepository } from "../../../domain/responsavel-tecnico/IResponsavelTecnicoRepository.js";
import type { IUseCase } from "../../IUseCase.js";
import type { IClock } from "../../ports/IClock.js";
import type { IIdGenerator } from "../../ports/IIdGenerator.js";
import type { ILogger } from "../../ports/ILogger.js";

export interface DocumentoInicialInput {
  readonly tipo: TipoDocumento;
  readonly numero: string;
  readonly dataEmissao: string;
  readonly dataValidade: string;
}

export interface RegistrarCargaQuimicaInput {
  readonly produtoQuimicoId: string;
  readonly quantidade: { valor: number; unidadeMedida: UnidadeMedida };
  readonly origem: string;
  readonly destino: string;
  readonly responsavelTecnicoId: string;
  readonly codigo?: string;
  readonly classeRisco?: string;
  readonly dataEntrada?: string;
  readonly documentos?: ReadonlyArray<DocumentoInicialInput>;
}

export interface RegistrarCargaQuimicaOutput {
  readonly carga: CargaQuimica;
}

const MAXIMO_TENTATIVAS_CODIGO = 5;

function gerarCodigo(agora: Date): string {
  const ano = agora.getUTCFullYear();
  const sequencia = Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, "0");
  return `CQ-${ano}-${sequencia}`;
}

/** UC03 — Registrar carga química. */
export class RegistrarCargaQuimica
  implements IUseCase<RegistrarCargaQuimicaInput, RegistrarCargaQuimicaOutput>
{
  constructor(
    private readonly cargaRepositorio: ICargaQuimicaRepository,
    private readonly produtoRepositorio: IProdutoQuimicoRepository,
    private readonly responsavelTecnicoRepositorio: IResponsavelTecnicoRepository,
    private readonly clock: IClock,
    private readonly idGenerator: IIdGenerator,
    private readonly logger: ILogger,
  ) {}

  async executar(input: RegistrarCargaQuimicaInput): Promise<RegistrarCargaQuimicaOutput> {
    if (!input.produtoQuimicoId?.trim()) {
      throw CargaQuimicaError.produtoNaoInformado();
    }
    const produto = await this.produtoRepositorio.buscarPorId(input.produtoQuimicoId);
    if (!produto) {
      throw ProdutoQuimicoError.naoEncontrado(input.produtoQuimicoId);
    }

    if (!input.responsavelTecnicoId?.trim()) {
      throw CargaQuimicaError.responsavelTecnicoNaoInformado();
    }
    const responsavelTecnico = await this.responsavelTecnicoRepositorio.buscarPorId(
      input.responsavelTecnicoId,
    );
    if (!responsavelTecnico) {
      throw ResponsavelTecnicoError.naoEncontrado(input.responsavelTecnicoId);
    }

    const agora = this.clock.agora();
    const codigoInformadoPeloCliente = Boolean(input.codigo?.trim());
    let tentativas = codigoInformadoPeloCliente ? 1 : MAXIMO_TENTATIVAS_CODIGO;
    let ultimoErro: unknown;

    while (tentativas > 0) {
      tentativas -= 1;
      const codigo = codigoInformadoPeloCliente ? (input.codigo as string).trim() : gerarCodigo(agora);
      try {
        const carga = CargaQuimica.registrar(
          {
            id: this.idGenerator.gerar(),
            codigo,
            produtoQuimicoId: produto.id,
            quantidade: input.quantidade,
            origem: input.origem,
            destino: input.destino,
            responsavelTecnicoId: responsavelTecnico.id,
            classeRisco: input.classeRisco,
            dataEntrada: input.dataEntrada ? new Date(input.dataEntrada) : undefined,
            agora,
          },
          produto,
        );

        for (const documento of input.documentos ?? []) {
          carga.adicionarDocumento({
            id: this.idGenerator.gerar(),
            tipo: documento.tipo,
            numero: documento.numero,
            dataEmissao: new Date(documento.dataEmissao),
            dataValidade: new Date(documento.dataValidade),
            agora,
          });
        }

        await this.cargaRepositorio.salvar(carga);
        this.logger.info("carga.registrada", { cargaId: carga.id, codigo: carga.codigo });
        return { carga };
      } catch (erro) {
        ultimoErro = erro;
        const ehConflitoDeCodigoAutoGerado =
          !codigoInformadoPeloCliente &&
          erro instanceof CargaQuimicaError &&
          erro.codigo === "CONFLITO" &&
          erro.regra === "RN01";
        if (!ehConflitoDeCodigoAutoGerado) {
          throw erro;
        }
      }
    }
    throw ultimoErro;
  }
}
