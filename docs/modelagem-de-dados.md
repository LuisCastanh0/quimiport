# Modelagem de Dados — QuimiPort (Fase 2)

> Este documento cobre a persistência real introduzida na Fase 2 (PostgreSQL via Prisma), complementando o [diagrama de domínio](diagramas/dominio.md) (Fase 1, DDD) e o [ER conceitual](diagramas/entidade-relacionamento.md) (Fase 1). O ER **físico** (schema real, com os 8 status e os campos novos) está em [`diagramas/er-fisico.md`](diagramas/er-fisico.md). Decisões e alternativas: ADR-10/ADR-11 em [`decisoes-arquiteturais.md`](decisoes-arquiteturais.md).

## 1. Visão geral

Todos os ids são `uuid`; todos os timestamps são `timestamptz` (UTC); nomes de tabela e coluna em `snake_case` português. O schema fonte da verdade é [`../prisma/schema.prisma`](../prisma/schema.prisma); a migração inicial está em [`../prisma/migrations/20260101000000_init/migration.sql`](../prisma/migrations/20260101000000_init/migration.sql).

> **Nota sobre o ambiente usado nesta implementação:** o schema foi validado com `prisma validate`/`prisma generate` (que não exigem conexão com o banco). Não havia PostgreSQL acessível no ambiente de desenvolvimento usado para escrever este código, então a migração SQL foi escrita manualmente a partir do schema, em vez de gerada por `prisma migrate dev` contra um banco real. Ela deve ser a primeira a rodar (`npm run db:migrate`) contra um PostgreSQL real — ver o relatório final do agente para o que ficou pendente de verificação humana.

## 2. Tabelas

### `produtos_quimicos`

| Coluna | Tipo | Observações |
|---|---|---|
| `id` | uuid, PK | |
| `nome` | text, único | RN08 |
| `descricao` | text, opcional | |
| `numero_onu` | text, opcional | formato `UN` + 4 dígitos |
| `classe_risco` | varchar(1) | `CHECK IN ('1'..'9')` — RN09; ver nota abaixo |
| `grupo_compatibilidade` | text | |
| `status` | enum `status_produto` (`Ativo`\|`Inativo`) | RN16 |
| `created_at`, `updated_at` | timestamptz | |

### `responsaveis_tecnicos`

| Coluna | Tipo | Observações |
|---|---|---|
| `id` | uuid, PK | |
| `nome` | text | |
| `registro_numero`, `registro_orgao` | text | CRQ/CREA |
| `especialidade` | text, opcional | |
| `created_at`, `updated_at` | timestamptz | |

### `cargas_quimicas`

| Coluna | Tipo | Observações |
|---|---|---|
| `id` | uuid, PK | |
| `codigo` | text, único | `CQ-<ano>-<6 dígitos>` |
| `produto_quimico_id` | uuid, FK -> `produtos_quimicos.id`, `ON DELETE RESTRICT` | RN01 |
| `quantidade_valor` | `numeric(14,3)`, `CHECK > 0` | RN11 |
| `unidade_medida` | enum `unidade_medida` (`kg`\|`L`\|`ton`) | |
| `origem`, `destino` | text | |
| `responsavel_tecnico_id` | uuid, FK -> `responsaveis_tecnicos.id`, `ON DELETE RESTRICT` | RN12 |
| `classe_risco` | varchar(1), `CHECK IN ('1'..'9')` | RN03 |
| `status` | enum `status_carga` (8 valores) | RN14/RN15 |
| `aceite_responsavel_tecnico_em` | timestamptz, opcional | RN13 |
| `data_entrada` | timestamptz | |
| `version` | integer, default 0 | optimistic locking |
| `created_at`, `updated_at` | timestamptz | |

Índices: `status`, `produto_quimico_id`, `codigo`.

### `documentos_carga`

| Coluna | Tipo | Observações |
|---|---|---|
| `id` | uuid, PK | |
| `carga_id` | uuid, FK -> `cargas_quimicas.id`, `ON DELETE CASCADE` | |
| `tipo` | enum `tipo_documento` (`FichaSeguranca`\|`LaudoTecnico`\|`LicencaTransporte`) | RN17 |
| `numero` | text | |
| `data_emissao`, `data_validade` | timestamptz | |
| `status_validacao` | enum `status_validacao_documento` (`Pendente`\|`Valido`\|`Invalido`) | |
| `created_at`, `updated_at` | timestamptz | |

`UNIQUE (carga_id, tipo)` — um documento de cada tipo por carga.

### `inspecoes`

| Coluna | Tipo | Observações |
|---|---|---|
| `id` | uuid, PK | |
| `carga_id` | uuid, FK -> `cargas_quimicas.id`, `ON DELETE CASCADE` | |
| `data_inspecao` | timestamptz | |
| `inspetor_responsavel` | text | |
| `resultado` | enum `resultado_inspecao` (`Pendente`\|`Aprovada`\|`Reprovada`) | RN07 |
| `parecer` | text, opcional | |
| `created_at`, `updated_at` | timestamptz | |

### `historico_status_carga`

| Coluna | Tipo | Observações |
|---|---|---|
| `id` | uuid, PK | |
| `carga_id` | uuid, FK -> `cargas_quimicas.id`, `ON DELETE CASCADE` | |
| `status_anterior` | enum `status_carga`, nullable | `null` na primeira linha (registro) |
| `status_novo` | enum `status_carga` | |
| `motivo` | text, opcional | |
| `ocorrido_em` | timestamptz | |

**Append-only**: nenhuma linha desta tabela é atualizada ou apagada — só inserida, uma vez por transição efetivada (UC08, interno). Alimenta UC11 (consultar histórico).

### `areas_armazenamento`

Modelada (ver seção 4), mas sem endpoint na Fase 2 — fora do contrato de API do PDF.

## 3. Relacionamento carga -> produto / carga -> RT

`cargas_quimicas.produto_quimico_id` e `cargas_quimicas.responsavel_tecnico_id` são FKs obrigatórias com `ON DELETE RESTRICT`: um produto ou RT referenciado por ao menos uma carga não pode ser apagado (coerente com a regra de domínio de que a carga só referencia por id, nunca por composição — ver [`diagramas/dominio.md`](diagramas/dominio.md)). Como o sistema nunca faz hard delete (cancelamento e inativação são lógicos, via coluna `status`), esse `RESTRICT` nunca chega a ser testado em uso normal — é uma salvaguarda.

## 4. Como o status é controlado

Três camadas, nenhuma duplicando a outra:

1. **Enum Postgres** (`status_carga`) — garante, no nível do banco, que a coluna só aceita um dos 8 valores válidos.
2. **Tabela de transições no domínio** (`src/domain/carga-quimica/transicoes.ts`) — única fonte de verdade sobre *quais* transições entre esses 8 valores são permitidas (RN14) e quais exigem motivo.
3. **`historico_status_carga`** — registra o resultado de cada transição efetivada, nunca é usada para decidir se uma transição é permitida (isso é 100% responsabilidade do domínio, não do histórico).

## 5. Classe de risco: por que `VARCHAR(1)` + `CHECK`, não enum Postgres

Identificadores de enum no Prisma (e em muitas linguagens) não podem começar com dígito — um enum `ClasseRisco { 1, 2, ..., 9 }` não compila. A classe de risco ONU é, por natureza, os dígitos `1`-`9`. Em vez de prefixar artificialmente (`C1`, `C2`, ...) e mapear de volta a cada leitura, optamos por `VARCHAR(1)` com `CHECK (classe_risco IN ('1','2',...,'9'))` — mesma garantia de integridade do banco, sem indireção de mapeamento. `categoriaPerigo` (ex.: "Líquidos inflamáveis" para a classe `3`) é **derivada** no domínio (`ClassificacaoRisco.categoriaPerigo`), não persistida.

## 6. Diagrama ER físico

Ver [`diagramas/er-fisico.md`](diagramas/er-fisico.md).

## 7. Como os dados podem evoluir

- **Áreas de armazenamento** — tabela já modelada (`areas_armazenamento`); falta a FK `cargas_quimicas.area_armazenamento_id` e as regras de compatibilidade química entre cargas na mesma área (citadas como evolução futura em [`dominio.md`](dominio.md)).
- **Autenticação/usuários** — nenhuma tabela de usuário existe ainda; os "atores" dos casos de uso ([`casos-de-uso.md`](casos-de-uso.md)) são, por ora, conceituais. Uma tabela `usuarios` + autenticação (JWT/sessão) e autorização por papel seriam a evolução natural, sem exigir mudança no domínio (ADR-01).
- **Arquivos de documento** — hoje `documentos_carga` só guarda metadados (tipo, número, validade, status); o arquivo em si (PDF do laudo, por exemplo) poderia ser persistido em um object storage (S3-compatível), referenciado por uma nova coluna `arquivo_url`.
- **Outbox de eventos** — os eventos de negócio hoje só existem como linhas de log estruturado (`carga.status_alterado`, etc. — ver §9 das instruções da Fase 2 e `PinoLogger`); uma tabela `eventos_outbox` permitiria publicá-los de forma transacional para um message broker em fases futuras, sem acoplar o domínio a nenhuma infraestrutura de mensageria.
