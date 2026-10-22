-- QuimiPort — Fase 2 — migração inicial
-- Gerada manualmente a partir de `prisma/schema.prisma` (sem acesso a um
-- PostgreSQL ao vivo no ambiente de desenvolvimento usado para esta
-- implementação — ver nota em docs/modelagem-de-dados.md). O schema foi
-- validado com `prisma validate`/`prisma generate` (que não exigem
-- conexão com o banco); esta migração deve ser a primeira a rodar contra
-- um PostgreSQL real (`npm run db:migrate`).

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums -----------------------------------------------------------------

CREATE TYPE "status_produto" AS ENUM ('Ativo', 'Inativo');

CREATE TYPE "status_carga" AS ENUM (
  'Registrada',
  'EmAnalise',
  'EmInspecao',
  'Liberada',
  'Bloqueada',
  'EmMovimentacao',
  'Finalizada',
  'Cancelada'
);

CREATE TYPE "unidade_medida" AS ENUM ('kg', 'L', 'ton');

CREATE TYPE "tipo_documento" AS ENUM ('FichaSeguranca', 'LaudoTecnico', 'LicencaTransporte');

CREATE TYPE "status_validacao_documento" AS ENUM ('Pendente', 'Valido', 'Invalido');

CREATE TYPE "resultado_inspecao" AS ENUM ('Pendente', 'Aprovada', 'Reprovada');

-- Tabelas -----------------------------------------------------------------

CREATE TABLE "produtos_quimicos" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "nome" TEXT NOT NULL,
  "descricao" TEXT,
  "numero_onu" TEXT,
  "classe_risco" VARCHAR(1) NOT NULL,
  "grupo_compatibilidade" TEXT NOT NULL,
  "status" "status_produto" NOT NULL DEFAULT 'Ativo',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL,

  CONSTRAINT "produtos_quimicos_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "produtos_quimicos_classe_risco_check" CHECK ("classe_risco" IN ('1','2','3','4','5','6','7','8','9'))
);

CREATE UNIQUE INDEX "produtos_quimicos_nome_key" ON "produtos_quimicos"("nome");

CREATE TABLE "responsaveis_tecnicos" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "nome" TEXT NOT NULL,
  "registro_numero" TEXT NOT NULL,
  "registro_orgao" TEXT NOT NULL,
  "especialidade" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL,

  CONSTRAINT "responsaveis_tecnicos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "cargas_quimicas" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "codigo" TEXT NOT NULL,
  "produto_quimico_id" UUID NOT NULL,
  "quantidade_valor" DECIMAL(14,3) NOT NULL,
  "unidade_medida" "unidade_medida" NOT NULL,
  "origem" TEXT NOT NULL,
  "destino" TEXT NOT NULL,
  "responsavel_tecnico_id" UUID NOT NULL,
  "classe_risco" VARCHAR(1) NOT NULL,
  "status" "status_carga" NOT NULL DEFAULT 'Registrada',
  "aceite_responsavel_tecnico_em" TIMESTAMPTZ,
  "data_entrada" TIMESTAMPTZ NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL,

  CONSTRAINT "cargas_quimicas_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "cargas_quimicas_classe_risco_check" CHECK ("classe_risco" IN ('1','2','3','4','5','6','7','8','9')),
  CONSTRAINT "cargas_quimicas_quantidade_valor_check" CHECK ("quantidade_valor" > 0)
);

CREATE UNIQUE INDEX "cargas_quimicas_codigo_key" ON "cargas_quimicas"("codigo");
CREATE INDEX "cargas_quimicas_status_idx" ON "cargas_quimicas"("status");
CREATE INDEX "cargas_quimicas_produto_quimico_id_idx" ON "cargas_quimicas"("produto_quimico_id");
CREATE INDEX "cargas_quimicas_codigo_idx" ON "cargas_quimicas"("codigo");

ALTER TABLE "cargas_quimicas"
  ADD CONSTRAINT "cargas_quimicas_produto_quimico_id_fkey"
  FOREIGN KEY ("produto_quimico_id") REFERENCES "produtos_quimicos"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "cargas_quimicas"
  ADD CONSTRAINT "cargas_quimicas_responsavel_tecnico_id_fkey"
  FOREIGN KEY ("responsavel_tecnico_id") REFERENCES "responsaveis_tecnicos"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "documentos_carga" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "carga_id" UUID NOT NULL,
  "tipo" "tipo_documento" NOT NULL,
  "numero" TEXT NOT NULL,
  "data_emissao" TIMESTAMPTZ NOT NULL,
  "data_validade" TIMESTAMPTZ NOT NULL,
  "status_validacao" "status_validacao_documento" NOT NULL DEFAULT 'Pendente',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL,

  CONSTRAINT "documentos_carga_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "documentos_carga_carga_id_tipo_key" ON "documentos_carga"("carga_id", "tipo");

ALTER TABLE "documentos_carga"
  ADD CONSTRAINT "documentos_carga_carga_id_fkey"
  FOREIGN KEY ("carga_id") REFERENCES "cargas_quimicas"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "inspecoes" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "carga_id" UUID NOT NULL,
  "data_inspecao" TIMESTAMPTZ NOT NULL,
  "inspetor_responsavel" TEXT NOT NULL,
  "resultado" "resultado_inspecao" NOT NULL DEFAULT 'Pendente',
  "parecer" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL,

  CONSTRAINT "inspecoes_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "inspecoes"
  ADD CONSTRAINT "inspecoes_carga_id_fkey"
  FOREIGN KEY ("carga_id") REFERENCES "cargas_quimicas"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "historico_status_carga" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "carga_id" UUID NOT NULL,
  "status_anterior" "status_carga",
  "status_novo" "status_carga" NOT NULL,
  "motivo" TEXT,
  "ocorrido_em" TIMESTAMPTZ NOT NULL,

  CONSTRAINT "historico_status_carga_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "historico_status_carga"
  ADD CONSTRAINT "historico_status_carga_carga_id_fkey"
  FOREIGN KEY ("carga_id") REFERENCES "cargas_quimicas"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "areas_armazenamento" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "codigo" TEXT NOT NULL,
  "capacidade" DECIMAL(14,3),
  "restricoes" TEXT,

  CONSTRAINT "areas_armazenamento_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "areas_armazenamento_codigo_key" ON "areas_armazenamento"("codigo");
