import { describe, expect, it } from "vitest";
import type { ICargaQuimicaRepository } from "../../../src/domain/carga-quimica/ICargaQuimicaRepository.js";
import { StatusCarga } from "../../../src/domain/carga-quimica/StatusCarga.js";
import { CargaQuimicaBuilder } from "../../support/builders/CargaQuimicaBuilder.js";

/**
 * Contrato compartilhado — roda a mesma bateria de asserções contra
 * qualquer implementação de `ICargaQuimicaRepository` (em memória ou
 * Prisma), garantindo que a implementação real respeita o que o domínio
 * espera (ver §12.1 das instruções da Fase 2 e `docs/qualidade.md`).
 */
export interface OpcoesContratoCargaQuimica {
  /**
   * Garante que os pré-requisitos (produto, responsável técnico) de uma
   * carga recém-construída existem no destino antes do `salvar` — no
   * fake em memória não há FK de verdade, então é um no-op; no Prisma
   * precisa inserir as linhas correspondentes antes (FK `RESTRICT`).
   */
  antesDeSalvarNovaCarga?: (carga: ReturnType<CargaQuimicaBuilder["construir"]>) => Promise<void>;
}

export function testarContratoCargaQuimicaRepository(
  nome: string,
  criarRepositorio: () => ICargaQuimicaRepository | Promise<ICargaQuimicaRepository>,
  opcoes: OpcoesContratoCargaQuimica = {},
): void {
  async function novaCargaPersistivel() {
    const carga = new CargaQuimicaBuilder().construir();
    await opcoes.antesDeSalvarNovaCarga?.(carga);
    return carga;
  }

  describe(`Contrato ICargaQuimicaRepository — ${nome}`, () => {
    it("persiste e recupera uma carga recém-registrada", async () => {
      const repositorio = await criarRepositorio();
      const carga = await novaCargaPersistivel();
      await repositorio.salvar(carga);

      const recuperada = await repositorio.buscarPorId(carga.id);
      expect(recuperada).not.toBeNull();
      expect(recuperada?.codigo).toBe(carga.codigo);
      expect(recuperada?.status).toBe(StatusCarga.Registrada);
    });

    it("retorna null para id inexistente", async () => {
      const repositorio = await criarRepositorio();
      await expect(repositorio.buscarPorId("00000000-0000-0000-0000-000000000000")).resolves.toBeNull();
    });

    it("busca por código", async () => {
      const repositorio = await criarRepositorio();
      const carga = await novaCargaPersistivel();
      await repositorio.salvar(carga);
      const recuperada = await repositorio.buscarPorCodigo(carga.codigo);
      expect(recuperada?.id).toBe(carga.id);
    });

    it("persiste mudanças de status e histórico", async () => {
      const repositorio = await criarRepositorio();
      const carga = await novaCargaPersistivel();
      await repositorio.salvar(carga);

      const carregada = await repositorio.buscarPorId(carga.id);
      carregada?.iniciarAnalise(new Date());
      await repositorio.salvar(carregada!);

      const recarregada = await repositorio.buscarPorId(carga.id);
      expect(recarregada?.status).toBe(StatusCarga.EmAnalise);
      expect(recarregada?.historicoStatus).toHaveLength(2);
    });

    it("detecta conflito de versão em escrita concorrente (409)", async () => {
      const repositorio = await criarRepositorio();
      const carga = await novaCargaPersistivel();
      await repositorio.salvar(carga);

      const copiaA = await repositorio.buscarPorId(carga.id);
      const copiaB = await repositorio.buscarPorId(carga.id);

      copiaA?.iniciarAnalise(new Date());
      await repositorio.salvar(copiaA!);

      copiaB?.iniciarAnalise(new Date());
      await expect(repositorio.salvar(copiaB!)).rejects.toMatchObject({ codigo: "CONFLITO" });
    });

    it("lista cargas filtrando por status", async () => {
      const repositorio = await criarRepositorio();
      const carga = await novaCargaPersistivel();
      await repositorio.salvar(carga);

      const resultado = await repositorio.listar({ status: StatusCarga.Registrada });
      expect(resultado.total).toBeGreaterThanOrEqual(1);
      expect(resultado.dados.every((item) => item.status === StatusCarga.Registrada)).toBe(true);
    });
  });
}
