import { CargaQuimica } from "../../../domain/carga-quimica/CargaQuimica.js";
import { CargaQuimicaError } from "../../../domain/carga-quimica/errors/CargaQuimicaError.js";
import type {
  FiltroCargaQuimica,
  ICargaQuimicaRepository,
  ResultadoListaCargaQuimica,
} from "../../../domain/carga-quimica/ICargaQuimicaRepository.js";

/**
 * Fake usado nos testes unitários da camada de aplicação. Simula o
 * optimistic locking real (feito via `WHERE version = X` no Prisma —
 * ver `infrastructure/persistence/prisma`) rastreando, por identidade de
 * objeto, a versão lida por `buscarPorId`.
 */
export class InMemoryCargaQuimicaRepository implements ICargaQuimicaRepository {
  private readonly registros = new Map<string, CargaQuimica>();
  /** Versão confirmada no "banco" por id — independente do objeto mutável em memória. */
  private readonly versaoCommitada = new Map<string, number>();
  /** Versão que cada instância carregada tinha ao ser lida (snapshot numérico, não uma referência viva). */
  private readonly versaoNoCarregamento = new WeakMap<CargaQuimica, number>();

  async salvar(carga: CargaQuimica): Promise<void> {
    const versaoCommitadaAtual = this.versaoCommitada.get(carga.id);
    if (versaoCommitadaAtual === undefined) {
      const colisaoDeCodigo = [...this.registros.values()].some((c) => c.codigo === carga.codigo);
      if (colisaoDeCodigo) {
        throw CargaQuimicaError.codigoDuplicado(carga.codigo);
      }
    } else {
      const versaoEsperada = this.versaoNoCarregamento.get(carga);
      if (versaoEsperada === undefined || versaoCommitadaAtual !== versaoEsperada) {
        throw CargaQuimicaError.conflitoDeVersao();
      }
    }
    this.registros.set(carga.id, carga);
    this.versaoCommitada.set(carga.id, carga.version);
    this.versaoNoCarregamento.set(carga, carga.version);
  }

  async buscarPorId(id: string): Promise<CargaQuimica | null> {
    const carga = this.registros.get(id);
    if (!carga) {
      return null;
    }
    this.versaoNoCarregamento.set(carga, carga.version);
    return carga;
  }

  async buscarPorCodigo(codigo: string): Promise<CargaQuimica | null> {
    for (const carga of this.registros.values()) {
      if (carga.codigo === codigo) {
        return carga;
      }
    }
    return null;
  }

  async listar(filtro: FiltroCargaQuimica): Promise<ResultadoListaCargaQuimica> {
    let dados = [...this.registros.values()];
    if (filtro.status) {
      dados = dados.filter((carga) => carga.status === filtro.status);
    }
    if (filtro.produtoQuimicoId) {
      dados = dados.filter((carga) => carga.produtoQuimicoId === filtro.produtoQuimicoId);
    }
    const total = dados.length;
    const pagina = filtro.pagina ?? 1;
    const limite = filtro.limite ?? 20;
    const inicio = (pagina - 1) * limite;
    return { dados: dados.slice(inicio, inicio + limite), total };
  }
}
