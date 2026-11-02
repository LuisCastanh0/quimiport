import { CargaQuimica } from "../../../../domain/carga-quimica/CargaQuimica.js";
import { CargaQuimicaError } from "../../../../domain/carga-quimica/errors/CargaQuimicaError.js";
import type {
  FiltroCargaQuimica,
  ICargaQuimicaRepository,
  ResultadoListaCargaQuimica,
} from "../../../../domain/carga-quimica/ICargaQuimicaRepository.js";
import type { PrismaClient } from "../client.js";
import {
  CargaQuimicaMapper,
  INCLUDE_AGREGADO_COMPLETO,
} from "../mappers/CargaQuimicaMapper.js";

interface EstadoCarregamento {
  readonly version: number;
  readonly historicoCount: number;
}

function isUniqueConstraintError(erro: unknown): boolean {
  return Boolean(
    erro && typeof erro === "object" && "code" in erro && (erro as { code: unknown }).code === "P2002",
  );
}

/**
 * Persiste o agregado completo (carga + documentos + inspeções + novas
 * linhas de histórico) em uma única transação, com checagem otimista de
 * versão via `updateMany({ where: { version: versãoNoCarregamento } })` —
 * ver §6 das instruções da Fase 2.
 */
export class PrismaCargaQuimicaRepository implements ICargaQuimicaRepository {
  private readonly estadoCarregamento = new WeakMap<CargaQuimica, EstadoCarregamento>();

  constructor(private readonly prisma: PrismaClient) {}

  async salvar(carga: CargaQuimica): Promise<void> {
    const estadoAnterior = this.estadoCarregamento.get(carga);
    const linhaPrincipal = CargaQuimicaMapper.linhaPrincipal(carga);

    await this.prisma.$transaction(async (tx) => {
      if (!estadoAnterior) {
        try {
          await tx.cargaQuimica.create({
            data: { id: carga.id, version: carga.version, ...linhaPrincipal },
          });
        } catch (erro) {
          if (isUniqueConstraintError(erro)) {
            throw CargaQuimicaError.codigoDuplicado(carga.codigo);
          }
          throw erro;
        }
      } else {
        const resultado = await tx.cargaQuimica.updateMany({
          where: { id: carga.id, version: estadoAnterior.version },
          data: { version: carga.version, ...linhaPrincipal },
        });
        if (resultado.count === 0) {
          throw CargaQuimicaError.conflitoDeVersao();
        }
      }

      for (const documento of carga.documentos) {
        const dados = CargaQuimicaMapper.linhaDocumento(documento);
        await tx.documentoCarga.upsert({
          where: { id: documento.id },
          create: { id: documento.id, cargaId: carga.id, ...dados },
          update: dados,
        });
      }

      for (const inspecao of carga.inspecoes) {
        const dados = CargaQuimicaMapper.linhaInspecao(inspecao);
        await tx.inspecao.upsert({
          where: { id: inspecao.id },
          create: { id: inspecao.id, cargaId: carga.id, ...dados },
          update: dados,
        });
      }

      const novosHistoricos = carga.historicoStatus.slice(estadoAnterior?.historicoCount ?? 0);
      if (novosHistoricos.length > 0) {
        await tx.historicoStatusCarga.createMany({
          data: novosHistoricos.map((entrada) => ({
            cargaId: carga.id,
            statusAnterior: entrada.statusAnterior,
            statusNovo: entrada.statusNovo,
            motivo: entrada.motivo ?? null,
            ocorridoEm: entrada.ocorridoEm,
          })),
        });
      }
    });

    this.estadoCarregamento.set(carga, {
      version: carga.version,
      historicoCount: carga.historicoStatus.length,
    });
  }

  async buscarPorId(id: string): Promise<CargaQuimica | null> {
    const row = await this.prisma.cargaQuimica.findUnique({
      where: { id },
      include: INCLUDE_AGREGADO_COMPLETO,
    });
    if (!row) {
      return null;
    }
    const carga = CargaQuimicaMapper.paraDominio(row);
    this.estadoCarregamento.set(carga, {
      version: carga.version,
      historicoCount: carga.historicoStatus.length,
    });
    return carga;
  }

  async buscarPorCodigo(codigo: string): Promise<CargaQuimica | null> {
    const row = await this.prisma.cargaQuimica.findUnique({
      where: { codigo },
      include: INCLUDE_AGREGADO_COMPLETO,
    });
    if (!row) {
      return null;
    }
    const carga = CargaQuimicaMapper.paraDominio(row);
    this.estadoCarregamento.set(carga, {
      version: carga.version,
      historicoCount: carga.historicoStatus.length,
    });
    return carga;
  }

  async listar(filtro: FiltroCargaQuimica): Promise<ResultadoListaCargaQuimica> {
    const where = {
      ...(filtro.status ? { status: filtro.status } : {}),
      ...(filtro.produtoQuimicoId ? { produtoQuimicoId: filtro.produtoQuimicoId } : {}),
    };
    const pagina = filtro.pagina ?? 1;
    const limite = filtro.limite ?? 20;
    const [linhas, total] = await Promise.all([
      this.prisma.cargaQuimica.findMany({
        where,
        include: INCLUDE_AGREGADO_COMPLETO,
        skip: (pagina - 1) * limite,
        take: limite,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.cargaQuimica.count({ where }),
    ]);
    return { dados: linhas.map(CargaQuimicaMapper.paraDominio), total };
  }
}
