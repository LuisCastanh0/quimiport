import type { AreaArmazenamento } from "./AreaArmazenamento.js";

export interface IAreaArmazenamentoRepository {
  salvar(area: AreaArmazenamento): Promise<void>;
  buscarPorId(id: string): Promise<AreaArmazenamento | null>;
}
