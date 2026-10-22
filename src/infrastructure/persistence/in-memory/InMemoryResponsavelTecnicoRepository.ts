import type { IResponsavelTecnicoRepository } from "../../../domain/responsavel-tecnico/IResponsavelTecnicoRepository.js";
import type { ResponsavelTecnico } from "../../../domain/responsavel-tecnico/ResponsavelTecnico.js";

export class InMemoryResponsavelTecnicoRepository implements IResponsavelTecnicoRepository {
  private readonly registros = new Map<string, ResponsavelTecnico>();

  async salvar(rt: ResponsavelTecnico): Promise<void> {
    this.registros.set(rt.id, rt);
  }

  async buscarPorId(id: string): Promise<ResponsavelTecnico | null> {
    return this.registros.get(id) ?? null;
  }

  async listar(): Promise<ReadonlyArray<ResponsavelTecnico>> {
    return [...this.registros.values()];
  }
}
