import type { IResponsavelTecnicoRepository } from "../../../../domain/responsavel-tecnico/IResponsavelTecnicoRepository.js";
import type { ResponsavelTecnico } from "../../../../domain/responsavel-tecnico/ResponsavelTecnico.js";
import type { PrismaClient } from "../client.js";
import { ResponsavelTecnicoMapper } from "../mappers/ResponsavelTecnicoMapper.js";

export class PrismaResponsavelTecnicoRepository implements IResponsavelTecnicoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async salvar(rt: ResponsavelTecnico): Promise<void> {
    const dados = ResponsavelTecnicoMapper.paraPersistencia(rt);
    await this.prisma.responsavelTecnico.upsert({
      where: { id: rt.id },
      create: { id: rt.id, ...dados },
      update: dados,
    });
  }

  async buscarPorId(id: string): Promise<ResponsavelTecnico | null> {
    const row = await this.prisma.responsavelTecnico.findUnique({ where: { id } });
    return row ? ResponsavelTecnicoMapper.paraDominio(row) : null;
  }

  async listar(): Promise<ReadonlyArray<ResponsavelTecnico>> {
    const rows = await this.prisma.responsavelTecnico.findMany({ orderBy: { createdAt: "desc" } });
    return rows.map(ResponsavelTecnicoMapper.paraDominio);
  }
}
