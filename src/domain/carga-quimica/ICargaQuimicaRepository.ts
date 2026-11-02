import type { CargaQuimica } from "./CargaQuimica.js";
import type { StatusCarga } from "./StatusCarga.js";

export interface FiltroCargaQuimica {
  readonly status?: StatusCarga;
  readonly produtoQuimicoId?: string;
  readonly pagina?: number;
  readonly limite?: number;
}

export interface ResultadoListaCargaQuimica {
  readonly dados: ReadonlyArray<CargaQuimica>;
  readonly total: number;
}

export interface ICargaQuimicaRepository {
  /**
   * Persiste o agregado completo (carga + documentos + inspeções + novas
   * linhas de histórico) em uma única transação, com checagem otimista de
   * versão — ver §6 das instruções da Fase 2.
   */
  salvar(carga: CargaQuimica): Promise<void>;
  buscarPorId(id: string): Promise<CargaQuimica | null>;
  buscarPorCodigo(codigo: string): Promise<CargaQuimica | null>;
  listar(filtro: FiltroCargaQuimica): Promise<ResultadoListaCargaQuimica>;
}
