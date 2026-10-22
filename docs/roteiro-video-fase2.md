# Roteiro do Vídeo — Fase 2 (5–10 min)

Checklist cronometrado para a gravação humana da demonstração da Fase 2 (hand-off item 1 em `PHASE2-AGENT-INSTRUCTIONS.md` §17). Siga a ordem; os comandos/curls podem ser colados direto num terminal com `docker compose` já rodando.

## Preparação (antes de gravar, não entra no tempo)

```bash
cp .env.example .env
docker compose up --build -d
docker compose exec api npm run db:seed
```

Produtos criados pelo seed: **Ácido Sulfúrico** (ativo, classe 8), **Amônia Anidra** (ativo, classe 2), **Produto Descontinuado** (inativo). RTs: `00000000-0000-0000-0000-000000000001` (Ana Paula Ferreira) e `...002` (Roberto Carvalho). Carga de exemplo: código `CQ-2026-000001`, status `Registrada`.

## 0:00–0:45 — Contexto

- Problema: controle de cargas químicas no Porto de Santos, cadastro de produtos, classificação de risco, documentação obrigatória, responsabilidade técnica.
- O que a Fase 2 entrega: API REST completa, PostgreSQL, Docker, testes automatizados, CI.

## 0:45–1:30 — Tecnologias e justificativa

- Framework: **Fastify** + Zod (schema -> validação + OpenAPI). Por quê: ver README "Tecnologias" e ADR-09.
- Banco: **PostgreSQL** via Prisma. Por quê: ver README "Banco de dados" e ADR-10.

## 1:30–2:15 — Estrutura do projeto

- Mostrar `src/domain`, `src/application`, `src/infrastructure`, `src/interfaces/http` no editor.
- Destacar `CargaQuimica.ts` (agregado), `transicoes.ts` (tabela de 11 transições).

## 2:15–3:00 — `docker compose up` e banco

```bash
docker compose ps
docker compose exec db psql -U quimiport -d quimiport -c "\dt"
docker compose exec db psql -U quimiport -d quimiport -c "SELECT codigo, status FROM cargas_quimicas;"
```

## 3:00–3:45 — `/docs` (Swagger UI)

- Abrir `http://localhost:3000/docs` no navegador; mostrar as tags (Produtos Químicos, Cargas Químicas, Responsáveis Técnicos).
- Expandir `POST /cargas-quimicas` e mostrar o exemplo de request/response.

## 3:45–5:00 — CRUD de produtos

```bash
curl -s -X POST http://localhost:3000/produtos-quimicos \
  -H "Content-Type: application/json" \
  -d '{"nome":"Hipoclorito de Sódio","classeRisco":"8","grupoCompatibilidade":"A"}' | jq
```

- Mostrar o 201 com `status: "Ativo"`.
- `GET /produtos-quimicos` listando.

## 5:00–6:30 — Registrar e listar cargas

```bash
curl -s -X POST http://localhost:3000/cargas-quimicas \
  -H "Content-Type: application/json" \
  -d '{
    "produtoQuimicoId": "<id do Ácido Sulfúrico, pego no GET anterior>",
    "quantidade": {"valor": 500, "unidadeMedida": "kg"},
    "origem": "Píer 2",
    "destino": "Armazém Central",
    "responsavelTecnicoId": "00000000-0000-0000-0000-000000000001"
  }' | jq
curl -s "http://localhost:3000/cargas-quimicas?status=Registrada" | jq
```

## 6:30–8:00 — Fluxo completo de status

Usando o id da carga criada (`<ID>`):

```bash
curl -s -X PATCH http://localhost:3000/cargas-quimicas/<ID>/status -H "Content-Type: application/json" -d '{"status":"EmAnalise"}'
curl -s -X POST http://localhost:3000/cargas-quimicas/<ID>/documentos -H "Content-Type: application/json" \
  -d '{"tipo":"FichaSeguranca","numero":"FS-1","dataEmissao":"2026-01-01T00:00:00.000Z","dataValidade":"2030-01-01T00:00:00.000Z"}'
# repetir para LaudoTecnico e LicencaTransporte, depois validar cada um:
curl -s -X PATCH http://localhost:3000/cargas-quimicas/<ID>/documentos/<DOC_ID>/validacao -d '{"status":"Valido"}' -H "Content-Type: application/json"
curl -s -X PATCH http://localhost:3000/cargas-quimicas/<ID>/status -d '{"status":"EmInspecao"}' -H "Content-Type: application/json"
curl -s -X PATCH http://localhost:3000/cargas-quimicas/<ID>/aceite-responsavel-tecnico -d '{"responsavelTecnicoId":"00000000-0000-0000-0000-000000000001"}' -H "Content-Type: application/json"
curl -s -X POST http://localhost:3000/cargas-quimicas/<ID>/inspecoes -d '{"dataInspecao":"2026-01-02T00:00:00.000Z","inspetorResponsavel":"Fernanda Lima","resultado":"Aprovada"}' -H "Content-Type: application/json"
curl -s -X PATCH http://localhost:3000/cargas-quimicas/<ID>/liberar
```

Mostrar o `status: "Liberada"` na resposta final.

## 8:00–8:45 — Regra de negócio rejeitada

```bash
# Tentar liberar uma carga recém-criada (sem documentação) — 422 REGRA_DE_NEGOCIO
curl -s -X PATCH http://localhost:3000/cargas-quimicas/<OUTRO_ID>/liberar | jq

# Tentar Cancelada -> Liberada — 409 TRANSICAO_INVALIDA
curl -s -X PATCH http://localhost:3000/cargas-quimicas/<ID>/cancelar -d '{"motivo":"demo"}' -H "Content-Type: application/json"
curl -s -X PATCH http://localhost:3000/cargas-quimicas/<ID>/liberar | jq
```

## 8:45–9:30 — Rodar os testes

```bash
npm run test:unit
npm run test:coverage
```

Destacar o resumo final (número de testes, cobertura).

## 9:30–10:00 — Pipeline no GitHub Actions

- Abrir a aba **Actions** do repositório no GitHub, mostrar o workflow `CI` verde na branch/PR, com os jobs `build-and-test` e `docker`.

## Encerramento

- Link do repositório e do PR da Fase 2.
- Mencionar `docs/decisoes-arquiteturais.md` (ADR-09 a ADR-15) para quem quiser detalhes das escolhas técnicas.
