import type { AreaArmazenamento } from "../../../domain/area-armazenamento/AreaArmazenamento.js";
import type { IAreaArmazenamentoRepository } from "../../../domain/area-armazenamento/IAreaArmazenamentoRepository.js";

export class InMemoryAreaArmazenamentoRepository implements IAreaArmazenamentoRepository {
  private readonly registros = new Map<string, AreaArmazenamento>();

  async salvar(area: AreaArmazenamento): Promise<void> {
    this.registros.set(area.id, area);
  }

  async buscarPorId(id: string): Promise<AreaArmazenamento | null> {
    return this.registros.get(id) ?? null;
  }
}
