// Script de seed — roda com `npm run db:seed` (tsx prisma/seed.ts). Usado
// para o ambiente de demonstração (ver docs/roteiro-video-fase2.md): cria
// alguns produtos (um deles Inativo), dois responsáveis técnicos e uma
// carga de exemplo já em EmAnalise.
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { criarPrismaClient } from "../src/infrastructure/persistence/prisma/client.js";

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL não configurada.");
  }
  const prisma = criarPrismaClient(databaseUrl);
  const agora = new Date();

  const acidoSulfurico = await prisma.produtoQuimico.upsert({
    where: { nome: "Ácido Sulfúrico" },
    update: {},
    create: {
      id: randomUUID(),
      nome: "Ácido Sulfúrico",
      descricao: "Ácido inorgânico forte, amplamente usado na indústria.",
      numeroOnu: "UN1830",
      classeRisco: "8",
      grupoCompatibilidade: "A",
      status: "Ativo",
      updatedAt: agora,
    },
  });

  const amonia = await prisma.produtoQuimico.upsert({
    where: { nome: "Amônia Anidra" },
    update: {},
    create: {
      id: randomUUID(),
      nome: "Amônia Anidra",
      descricao: "Gás tóxico e corrosivo, usado como fertilizante e refrigerante.",
      numeroOnu: "UN1005",
      classeRisco: "2",
      grupoCompatibilidade: "B",
      status: "Ativo",
      updatedAt: agora,
    },
  });

  await prisma.produtoQuimico.upsert({
    where: { nome: "Produto Descontinuado" },
    update: {},
    create: {
      id: randomUUID(),
      nome: "Produto Descontinuado",
      descricao: "Produto mantido apenas para demonstrar RN02/RN10 (inativo).",
      classeRisco: "9",
      grupoCompatibilidade: "C",
      status: "Inativo",
      updatedAt: agora,
    },
  });

  const rt1 = await prisma.responsavelTecnico.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      nome: "Ana Paula Ferreira",
      registroNumero: "CRQ-04123456",
      registroOrgao: "CRQ",
      especialidade: "Engenharia Química",
      updatedAt: agora,
    },
  });

  await prisma.responsavelTecnico.upsert({
    where: { id: "00000000-0000-0000-0000-000000000002" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000002",
      nome: "Roberto Carvalho",
      registroNumero: "CREA-98765",
      registroOrgao: "CREA",
      especialidade: "Segurança do Trabalho",
      updatedAt: agora,
    },
  });

  await prisma.cargaQuimica.upsert({
    where: { codigo: "CQ-2026-000001" },
    update: {},
    create: {
      id: randomUUID(),
      codigo: "CQ-2026-000001",
      produtoQuimicoId: acidoSulfurico.id,
      quantidadeValor: 1500,
      unidadeMedida: "kg",
      origem: "Píer 1 — Porto de Santos",
      destino: "Armazém Central",
      responsavelTecnicoId: rt1.id,
      classeRisco: "8",
      status: "Registrada",
      dataEntrada: agora,
      updatedAt: agora,
      historico: {
        create: [{ statusAnterior: null, statusNovo: "Registrada", ocorridoEm: agora }],
      },
    },
  });

  console.log("Seed concluído:", { acidoSulfurico: acidoSulfurico.id, amonia: amonia.id });
  await prisma.$disconnect();
}

main().catch(async (erro) => {
  console.error(erro);
  process.exitCode = 1;
});
