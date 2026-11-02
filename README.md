# QuimiPort

[![CI](https://github.com/LuisCastanh0/quimiport/actions/workflows/ci.yml/badge.svg)](https://github.com/LuisCastanh0/quimiport/actions/workflows/ci.yml)

Sistema para gestão de cargas químicas em ambiente portuário, inspirado nas operações do Porto de Santos.

> **Fase 2 — Backend, persistência, testes automatizados, Docker e CI.**
> Esta entrega evolui a Fase 1 (domínio e arquitetura, sem código) para a primeira versão funcional do backend: API REST em Node.js/TypeScript, persistência em PostgreSQL via Prisma, documentação OpenAPI/Swagger, logs estruturados, testes unitários e de integração, Docker/docker-compose e pipeline de CI no GitHub Actions. A Fase 1 permanece disponível em `docs/` (atualizada onde o contrato da Fase 2 exigiu mudança — ver "Histórico de alterações" no topo de cada arquivo afetado e ADR-13 em [`docs/decisoes-arquiteturais.md`](docs/decisoes-arquiteturais.md)).

## Descrição da solução

O QuimiPort centraliza o cadastro de produtos químicos, o registro de cargas associadas a esses produtos, a classificação de risco, a documentação obrigatória, a responsabilidade técnica formal e o controle do status de cada carga (da chegada até a liberação para movimentação ou o cancelamento) — tudo isso validado por regras de negócio concentradas no domínio (RN01–RN17, ver [`docs/regras-de-negocio.md`](docs/regras-de-negocio.md)), não espalhadas em controllers ou SQL.

## Contexto do problema

O Porto de Santos é um dos principais pontos de movimentação de cargas do Brasil, e entre os diversos tipos de carga que passam por lá, os produtos químicos são os que exigem mais cuidado: documentação adequada, classificação de risco e acompanhamento técnico. Na prática, esse controle ainda é feito de forma manual ou descentralizada em boa parte dos casos, o que dificulta consultar informações rapidamente, acompanhar o status de cada carga e validar as regras de segurança antes de liberar a movimentação.

## Tecnologias e justificativa

| Decisão | Escolha | Por quê (resumo — detalhe nos ADRs) |
|---|---|---|
| **Framework HTTP** | **Fastify** + [`fastify-type-provider-zod`](https://github.com/turkerdev/fastify-type-provider-zod) | Um único schema Zod gera validação de runtime, tipo TypeScript e documentação OpenAPI. Mantém os controllers finos (ADR-04/ADR-09): nenhuma regra de negócio no framework. Express exigiria bibliotecas extras para o mesmo resultado; NestJS competiria com a composição manual já decidida (ADR-08). |
| **Banco de dados** | **PostgreSQL** (`postgres:17-alpine`) via **Prisma** | Dados fortemente relacionais (carga → produto, carga → RT), `CHECK` constraints (quantidade > 0, classe de risco 1–9) e transação ao salvar o agregado completo — tudo garantido pelo banco, não só pela aplicação (ADR-10). Prisma confinado a `infrastructure/` (ADR-11): domínio e aplicação continuam framework-free. |
| Validação | Zod | Mesmo schema → validação HTTP + tipo + OpenAPI |
| Logs | pino (`pino-pretty` em dev) | Logging estruturado nativo do Fastify |
| Testes | Vitest + Supertest/`inject` | Unitário (domínio/aplicação, sem I/O) + integração (Postgres real) |
| Erros | `DomainError` lançada, mapeada em um único error handler | ADR-12 — resolve a indefinição deixada na Fase 1 |

## Como executar localmente (sem Docker)

Pré-requisitos: Node.js 24.x (ver `.nvmrc`) e um PostgreSQL acessível (local ou via `docker compose up -d db`, ver abaixo).

```bash
cp .env.example .env            # ajuste DATABASE_URL se necessário
npm ci
npm run db:generate             # gera o client Prisma (não exige banco)
npm run db:migrate              # aplica as migrações no banco apontado por DATABASE_URL
npm run db:seed                 # opcional — dados de exemplo (ver docs/roteiro-video-fase2.md)
npm run dev                     # http://localhost:3000, com reload automático
```

## Como executar com Docker

```bash
cp .env.example .env
docker compose up --build -d    # sobe "db" (Postgres) e "api"
curl http://localhost:3000/health
docker compose exec api npm run db:seed   # opcional
docker compose down -v          # para e remove volumes
```

A imagem (`Dockerfile`, multi-estágio) roda `prisma migrate deploy` antes de iniciar o servidor, como usuário não-root, com `HEALTHCHECK` em `/health`.

## Variáveis de ambiente

Ver [`.env.example`](.env.example) para os valores padrão usados pelo `docker-compose.yml`.

| Variável | Descrição |
|---|---|
| `NODE_ENV` | `development` \| `test` \| `production` |
| `PORT`, `HOST` | Endereço/porta do servidor HTTP |
| `LOG_LEVEL` | Nível do pino (`info`, `debug`, `silent`, ...) |
| `DATABASE_URL` | String de conexão PostgreSQL usada pela aplicação |
| `DATABASE_URL_TEST` | Banco separado usado pelos testes de integração (nunca aponte para produção) |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Credenciais usadas pelo serviço `db` do compose |

## Como executar os testes

```bash
npm run test:unit          # domínio + aplicação, sem I/O (sempre executável)
npm run test:integration   # persistência (Prisma) + HTTP — a parte de Prisma exige DATABASE_URL_TEST
npm run test:coverage      # suíte completa com relatório de cobertura
npm run lint                # inclui a regra de fronteira entre camadas (domain/application não podem importar infra/interfaces)
npm run typecheck
```

Os testes de persistência contra PostgreSQL real são pulados automaticamente (`describe.skipIf`) quando `DATABASE_URL_TEST` não está definida — rode `docker compose up -d db` antes para habilitá-los localmente; no CI, um *service container* Postgres já fica disponível.

## Como acessar a documentação da API

Com o servidor no ar: **Swagger UI em [`/docs`](http://localhost:3000/docs)**, JSON OpenAPI em `/docs/json`. Uma cópia exportada (via `npm run openapi:export`) fica versionada em [`docs/api/openapi.json`](docs/api/openapi.json).

## Principais endpoints

| Método | Caminho | Descrição |
|---|---|---|
| POST / GET | `/produtos-quimicos` | Cadastra (UC01) / lista produtos |
| GET / PUT | `/produtos-quimicos/:id` | Busca / atualiza (não altera status) |
| PATCH | `/produtos-quimicos/:id/inativar` | Inativa (UC02) |
| POST / GET | `/responsaveis-tecnicos` | Cadastra / lista responsáveis técnicos |
| POST / GET | `/cargas-quimicas` | Registra (UC03) / consulta por status (UC10) |
| GET | `/cargas-quimicas/:id` | Detalhe (inclui documentos, inspeções, aceite) |
| PATCH | `/cargas-quimicas/:id/status` | Atualiza status (UC08) — mesma tabela de 11 transições (RN14) dos endpoints dedicados |
| PATCH | `/cargas-quimicas/:id/bloquear` \| `/liberar` \| `/cancelar` | UC07 / UC06 / UC09 |
| POST | `/cargas-quimicas/:id/documentos` | Anexa documento (UC04) |
| PATCH | `/cargas-quimicas/:id/documentos/:documentoId/validacao` | Valida/invalida documento (UC04) |
| POST | `/cargas-quimicas/:id/inspecoes` | Registra inspeção (UC05) |
| PATCH | `/cargas-quimicas/:id/aceite-responsavel-tecnico` | Aceite formal do RT (UC12) |
| GET | `/cargas-quimicas/:id/historico` | Histórico de status (UC11) |
| GET | `/health` | Liveness + ping no banco |

Lista completa, com exemplos de request/response e todos os códigos de erro, em `/docs`.

### Contrato de erro

Toda resposta de erro segue o mesmo formato:

```json
{ "codigo": "TRANSICAO_INVALIDA", "mensagem": "...", "regra": "RN14", "detalhes": [], "requestId": "..." }
```

| HTTP | `codigo` | Quando |
|---|---|---|
| 400 | `VALIDACAO` | Schema inválido ou validação de domínio (ex.: quantidade ≤ 0) |
| 404 | `NAO_ENCONTRADO` | Produto/carga/RT/documento inexistente |
| 409 | `TRANSICAO_INVALIDA` \| `CONFLITO` | Transição de status proibida, estado terminal, duplicidade, conflito de versão |
| 422 | `REGRA_DE_NEGOCIO` | Pré-condição de negócio não satisfeita (produto inativo, sem documentação válida, sem aceite do RT, sem inspeção aprovada) |
| 500 | `ERRO_INTERNO` | Falha inesperada — nunca expõe stack trace no corpo |

## Banco de dados utilizado

PostgreSQL, acessado via Prisma — tabelas, relacionamentos, constraints e como o status é controlado (enum + tabela de transições no domínio + histórico append-only) estão detalhados em [`docs/modelagem-de-dados.md`](docs/modelagem-de-dados.md) e no [ER físico](docs/diagramas/er-fisico.md).

## Decisões arquiteturais

Quatro camadas (Domain, Application, Infrastructure, Interfaces), dependência sempre para dentro, regras de negócio só no domínio, fronteiras entre camadas aplicadas por lint (`eslint-plugin-boundaries`) — ver [`docs/arquitetura.md`](docs/arquitetura.md). Decisões específicas da Fase 2 (Fastify, PostgreSQL, Prisma confinado à infraestrutura, `DomainError` em vez de `Result`, substituição do modelo de status, estratégia de testes de integração, fronteiras por ferramenta): ADR-09 a ADR-15 em [`docs/decisoes-arquiteturais.md`](docs/decisoes-arquiteturais.md).

## Vocabulário — termos do desafio e onde ficam neste projeto

| Termo do desafio | Aqui |
|---|---|
| Rotas | `src/interfaces/http/routes/` |
| Controllers | `src/interfaces/http/controllers/` |
| Services | **Casos de uso** em `src/application/use-cases/` (sem camada genérica de "serviço" — ADR-08) |
| Repositórios | Portas em `src/domain/**/I*Repository.ts`; adapters em `src/infrastructure/persistence/` |
| Modelos | Entidades/VOs de domínio + modelos Prisma (persistência) |
| DTOs | Dentro de cada caso de uso + schemas Zod em `src/interfaces/http/schemas/` |
| Validações | Zod na borda (formato) + invariantes do agregado (negócio) |
| Tratamento de erros | `DomainError` + `src/interfaces/http/plugins/error-handler.ts` |
| Configurações | `src/infrastructure/config/env.ts` |

## Navegação pela documentação

| Documento | Conteúdo |
|---|---|
| [`docs/dominio.md`](docs/dominio.md) | Entendimento do domínio, usuários, linguagem ubíqua, entidades, objetos de valor e agregados |
| [`docs/casos-de-uso.md`](docs/casos-de-uso.md) | Casos de uso (objetivo, ator, entradas/saídas, regras e exceções) |
| [`docs/regras-de-negocio.md`](docs/regras-de-negocio.md) | Regras de negócio RN01–RN17 e onde ficam concentradas na arquitetura |
| [`docs/arquitetura.md`](docs/arquitetura.md) | Camadas, responsabilidades e a árvore de pastas real da Fase 2 |
| [`docs/typescript-javascript.md`](docs/typescript-javascript.md) | Decisões de uso de TypeScript, incluindo a escolha final `DomainError` vs. `Result` |
| [`docs/decisoes-arquiteturais.md`](docs/decisoes-arquiteturais.md) | ADR-01 a ADR-15 |
| [`docs/qualidade.md`](docs/qualidade.md) | Plano de qualidade, cenários de teste e estratégia de testes de integração |
| [`docs/modelagem-de-dados.md`](docs/modelagem-de-dados.md) | Tabelas, relacionamentos, constraints, controle de status |
| [`docs/diagramas/`](docs/diagramas/) | Domínio, fluxo de status (8 estados/11 transições), ER conceitual, ER físico, contexto |
| [`docs/api/openapi.json`](docs/api/openapi.json) | Especificação OpenAPI exportada |
| [`docs/roteiro-video-fase2.md`](docs/roteiro-video-fase2.md) | Roteiro cronometrado do vídeo de demonstração |

## Equipe

| Nome | RM |
|---|---|
| Luis Gustavo Aguirre Castanho | rm375479 |

## Vídeos de apresentação

- Fase 1: https://youtu.be/BB3CQ745Bes
- Fase 2: TODO — link do vídeo de demonstração da Fase 2 (ver [`docs/roteiro-video-fase2.md`](docs/roteiro-video-fase2.md))
