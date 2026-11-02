import type { ResponsavelTecnico } from "./ResponsavelTecnico.js";

export interface IResponsavelTecnicoRepository {
  salvar(rt: ResponsavelTecnico): Promise<void>;
  buscarPorId(id: string): Promise<ResponsavelTecnico | null>;
  listar(): Promise<ReadonlyArray<ResponsavelTecnico>>;
}
