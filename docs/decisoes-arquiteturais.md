# Decisões Arquiteturais — QuimiPort

Este documento cobre as principais decisões arquiteturais do projeto, registradas no formato de ADR (*Architecture Decision Record*) — Contexto, Decisão, Alternativas consideradas e Consequências.

## ADR-01 — Separar domínio, aplicação e infraestrutura em camadas

| | |
|---|---|
| **Contexto** | O QuimiPort concentra regras de segurança e conformidade (RN01–RN13) que precisam ser confiáveis e testáveis isoladamente, e o projeto será evoluído por várias fases (frontend, backend, banco de dados, possivelmente microsserviços). |
| **Decisão** | Separar o código em quatro camadas — `Domain`, `Application`, `Infrastructure`, `Interfaces` — com dependência sempre apontando para dentro, conforme detalhado em [`arquitetura.md`](arquitetura.md). |
| **Alternativas consideradas** | (a) Estrutura única por *feature*, sem separação de camadas — mais rápida para prototipar, mas mistura regra de negócio com detalhes de persistência/apresentação, dificultando testar o domínio isoladamente e trocar peças de infraestrutura depois. (b) MVC clássico — mais simples, porém tende a acumular regra de negócio no controller ou no model ligado ao banco, contrariando o objetivo de negócio-primeiro do desafio. |
| **Consequências** | Positivo: domínio testável sem infraestrutura, trocas de tecnologia (banco, framework web) que não tocam a regra de negócio, e uma curva de entendimento mais clara para quem entra no projeto depois. Negativo: mais arquivos e indireção do que uma estrutura simples exigiria.|

## ADR-02 — Concentrar regras de negócio no domínio, não nos casos de uso

| | |
|---|---|
| **Contexto** | As mesmas regras (ex.: "produto inativo não pode originar carga") podem ser checadas tanto dentro do agregado quanto no início do caso de uso que o invoca. |
| **Decisão** | Regras de negócio (invariantes) vivem dentro dos agregados/entidades do domínio (`CargaQuimica`, `ProdutoQuimico`, ...), nunca nos casos de uso — detalhado em [`regras-de-negocio.md`](regras-de-negocio.md), coluna "Camada/local de concentração". Casos de uso orquestram: buscam dados via repositório e chamam métodos do domínio. |
| **Alternativas consideradas** | Regras nos casos de uso (camada de aplicação) — mais direto de ler em um primeiro momento, mas duplica validação sempre que a mesma regra precisa valer em mais de um ponto de entrada (ex.: API REST e uma futura importação em lote), e permite criar um agregado em estado inválido caso algum código chame o construtor sem passar pelo caso de uso. |
| **Consequências** | Positivo: é impossível colocar `CargaQuimica` em estado inválido, não importa por onde ela seja criada/alterada — a garantia é no próprio tipo; Testes de regra de negócio não precisam simular toda a camada de aplicação. Negativo: exige disciplina para não "vazar" validação de volta para os casos de uso por conveniência. |

## ADR-03 — Utilizar TypeScript

| | |
|---|---|
| **Contexto** | O domínio do QuimiPort tem muitos conceitos com identidade e regras de transição de estado (status, classificação de risco, documentação obrigatória) que, em JavaScript puro, dependeriam só de disciplina e testes para não serem usados incorretamente. |
| **Decisão** | Implementar o QuimiPort em TypeScript, com `strict` habilitado, conforme detalhado em [`typescript-javascript.md`](typescript-javascript.md). |
| **Alternativas consideradas** | JavaScript puro com validação em runtime (ex.: biblioteca de schema) — funciona, mas move erros que poderiam ser pegos em tempo de compilação para o tempo de execução, e não documenta os contratos entre camadas no próprio código. |
| **Consequências** | Positivo: interfaces de repositório, DTOs e enums de status tornam os contratos entre camadas explícitos e verificáveis pelo compilador; refatoração é mais segura à medida que o projeto cresce nas próximas fases. Negativo: overhead de configuração (tsconfig, build) e uma curva de aprendizado para quem não é familiarizado com tipagem estática. |

## ADR-04 — Evolução para backend

| | |
|---|---|
| **Contexto** | Nesta fase não há API implementada; os casos de uso já existem como classes isoladas na camada `Application`. |
| **Decisão** | O backend entra como um novo adaptador na camada `Interfaces` (ex.: `interfaces/http/`), com controllers finos que apenas convertem requisição HTTP → DTO de entrada do caso de uso, chamam `usecase.executar()`, e convertem a saída em resposta HTTP. Nenhuma regra de negócio é escrita no controller. |
| **Alternativas consideradas** | Escrever a API diretamente acoplada aos casos de uso sem camada de adaptação — reduz um passo de indireção, mas acopla o formato de requisição/resposta HTTP ao contrato interno do caso de uso, dificultando reuso por outro tipo de cliente (ex.: mobile) no futuro. |
| **Consequências** | Os casos de uso já modelados nesta fase (UC01–UC12) não precisam mudar quando o backend for implementado, só ganham um adaptador HTTP na frente. |

## ADR-05 — Evolução para frontend

| | |
|---|---|
| **Contexto** | Nenhum frontend é entregue nesta fase; o domínio e os casos de uso não conhecem a existência de uma interface visual. |
| **Decisão** | O frontend (web) consumirá a futura API REST (ADR-04) como qualquer outro cliente HTTP, não tendo acesso direto ao domínio ou à infraestrutura do QuimiPort. A escolha de framework de frontend fica em aberto para a fase em que ele for de fato implementado. |
| **Alternativas consideradas** | Monorepo com frontend importando tipos/DTOs diretamente do backend TypeScript. Pode ser reavaliado como otimização futura (tipos compartilhados via pacote interno), mas não é uma decisão necessária nesta fase. |
| **Consequências** | O frontend pode começar a ser desenvolvido em paralelo ao backend assim que os contratos de DTO estiverem estáveis, usando os documentos de casos de uso ([`casos-de-uso.md`](casos-de-uso.md)) como especificação de tela por caso de uso. |

## ADR-06 — Evolução para mobile

| | |
|---|---|
| **Contexto** | Um app mobile, se vier a existir, precisa dos mesmos casos de uso que o backend já expõe via API REST. |
| **Decisão** | O app mobile é tratado como mais um cliente da mesma API REST usada pelo frontend web (ADR-04/ADR-05). Nenhuma nova camada de aplicação ou domínio é criada especificamente para mobile. |
| **Alternativas consideradas** | API dedicada para mobile (ex.: *backend for frontend*): só se justificaria se as necessidades de dados do app mobile divergirem muito das do frontend web (ex.: payloads reduzidos para rede móvel); não há indício disso nesta fase. |
| **Consequências** | Menor superfície para manter; se a divergência aparecer nas próximas fases, um *backend for frontend* pode ser adicionado como um novo adaptador em `Interfaces`, sem alterar `Application` nem `Domain`. |

## ADR-07 — Evolução para microsserviços

| | |
|---|---|
| **Contexto** | O domínio já está dividido em agregados independentes (`CargaQuimica`, `ProdutoQuimico`, `ResponsavelTecnico`, `AreaArmazenamento`), referenciados entre si por identificador, não por composição (ver [diagrama de domínio](diagramas/dominio.md).) |
| **Decisão** | Nesta fase, o QuimiPort permanece um **monólito modular** (todas as camadas em um único deployável). Cada agregado, por já ser desacoplado dos demais (referência por ID, sem transação compartilhada entre agregados), é um candidato natural a virar um serviço independente numa fase futura, se a necessidade de escala ou de times separados justificar. |
| **Alternativas consideradas** | Começar já com microsserviços separados por agregado — rejeitado nesta fase: adicionaria complexidade de comunicação distribuída (rede, consistência eventual, versionamento de contrato entre serviços) sem um problema real de escala que a justifique. |
| **Consequências** | A divisão em módulos por agregado hoje (pastas separadas em `domain/`, casos de uso isolados por operação) é o que torna essa migração futura viável sem reescrever o domínio. ADR-01/ADR-02 são o que preparam esse caminho. |

## ADR-08 — Como evitar acoplamento excessivo

| | |
|---|---|
| **Contexto** | Um sistema com várias entidades inter-relacionadas (produto, carga, responsável, documentos, inspeção) corre o risco de cada parte conhecer detalhes internos das outras, dificultando mudanças isoladas. |
| **Decisão** | Quatro mecanismos combinados: (1) regra de dependência entre camadas (ADR-01); (2) agregados referenciados por identificador, nunca por composição direta entre si (ver [diagrama de domínio](diagramas/dominio.md)); (3) portas/interfaces de repositório definidas no domínio e implementadas na infraestrutura (inversão de dependência); (4) um caso de uso por operação de negócio, em vez de serviços genéricos tipo `CargaService` com muitos métodos não relacionados. |
| **Alternativas consideradas** | Serviços de aplicação amplos por agregado (ex.: um único `CargaQuimicaService` com todos os métodos de UC03 a UC12) — mais simples de navegar no começo, mas tende a crescer sem limite claro e a acumular dependências desnecessárias entre operações que não têm relação entre si. |
| **Consequências** | Cada caso de uso tem exatamente as dependências que precisa (ex.: `LiberarCargaQuimica` só depende de `ICargaQuimicaRepository`), o que também facilita os testes unitários descritos em [`qualidade.md`](qualidade.md). |

## ADR-09 — Fastify como framework HTTP

| | |
|---|---|
| **Contexto** | A Fase 2 exige uma API REST real com validação de schema, geração de documentação OpenAPI e logging estruturado, sem comprometer a separação de camadas já definida (ADR-01/ADR-04). |
| **Decisão** | Usar **Fastify** como framework HTTP, com `fastify-type-provider-zod` para validação/tipagem a partir dos mesmos schemas Zod usados na borda, e `@fastify/swagger` + `@fastify/swagger-ui` para a documentação. |
| **Alternativas consideradas** | **Express** — ecossistema enorme, mas validação de schema e OpenAPI exigem bibliotecas adicionais, e o roteamento/middleware não têm suporte nativo a tipos; menos aderente ao objetivo de "um schema -> validação + tipo + doc". **NestJS** — oferece tudo isso nativamente, mas seu padrão de DI baseado em decorators e módulos competiria com a composição manual já decidida (ADR-08) e com os casos de uso como classes simples (`typescript-javascript.md`), forçando uma reestruturação artificial só para caber no framework. |
| **Consequências** | Positivo: controllers permanecem finos (ADR-04), o mesmo schema Zod vira validação HTTP e documentação OpenAPI automaticamente, logging via pino é nativo. Negativo: ecossistema de plugins do Fastify é menor que o do Express; a tipagem com `ZodTypeProvider` exige atenção em cada rota. |

## ADR-10 — PostgreSQL como banco de dados

| | |
|---|---|
| **Contexto** | A Fase 1 usou apenas repositórios em memória; a Fase 2 exige persistência real, com relacionamentos (carga -> produto, carga -> responsável técnico), constraints de negócio (quantidade > 0, classe de risco válida) e transações (salvar o agregado Carga Química completo). |
| **Decisão** | PostgreSQL (imagem oficial `postgres:17-alpine`), acessado via Prisma. |
| **Alternativas consideradas** | **MongoDB** — document store encaixaria bem no agregado `CargaQuimica` (documentos e inspeções embutidos), mas FKs reais para `ProdutoQuimico`/`ResponsavelTecnico` e `CHECK` de domínio (quantidade, classe de risco) ficariam só na aplicação, sem garantia do banco; transações multi-documento existem no Mongo moderno, mas o modelo é mais natural em SQL dado o tanto de relacionamento N:1 que o domínio já tem. |
| **Consequências** | Positivo: integridade referencial e `CHECK` constraints garantidas pelo próprio banco (RN11, RN03/RN09 refletidas em `CHECK`), suporte a transação ACID usado pelo repositório Prisma da carga. Negativo: schema relacional exige mapeamento explícito (mappers) entre linhas e agregado, mais verboso que persistir o agregado "como está". |

## ADR-11 — Prisma confinado à infraestrutura

| | |
|---|---|
| **Contexto** | O domínio não pode depender de `@prisma/client` (hard rule de framework-free do domínio/aplicação — §0.4 das instruções da Fase 2); mas alguém precisa converter entre as linhas do banco e os objetos de domínio. |
| **Decisão** | Todo uso de `@prisma/client`/Prisma fica em `infrastructure/persistence/prisma/` — `client.ts` (singleton, usando o driver adapter `@prisma/adapter-pg` exigido pelo Prisma 7), `repositories/*` (implementam as portas `I*Repository` do domínio) e `mappers/*` (linha Prisma <-> objeto de domínio, via `reconstituir()`, que não reaplica regras de criação). Nenhum outro arquivo do repositório importa `@prisma/client` diretamente — reforçado pela regra de lint de fronteiras (§8.3). |
| **Alternativas consideradas** | Usar os tipos gerados pelo Prisma diretamente como DTOs de aplicação — mais rápido de escrever, mas acopla a camada de aplicação ao schema do banco; uma migração de coluna passaria a exigir mudança em `application/`, quebrando a inversão de dependência do ADR-01/ADR-02. |
| **Consequências** | Positivo: domínio e aplicação continuam testáveis sem banco (ADR-02); troca de ORM no futuro tocaria só `infrastructure/persistence/prisma/`. Negativo: todo campo novo exige atualizar o mapper manualmente — mais um lugar para lembrar, mas isolado e fácil de testar (ver os testes de contrato do repositório). |

## ADR-12 — `DomainError` lançada em vez de `Result<T, E>`

| | |
|---|---|
| **Contexto** | A Fase 1 (`typescript-javascript.md`) deixou aberta a escolha entre `Result<T, E>` (preferido para "fluxos de validação de negócio esperados") e exceções tipadas, adiando a decisão final para a implementação. |
| **Decisão** | Lançar (`throw`) uma `DomainError` tipada — também para os fluxos de validação de negócio esperados, não só para falhas de infraestrutura. `DomainError` carrega `{ regra, tipo, codigo, mensagem, detalhes }`; um único `error-handler` na borda HTTP mapeia `tipo -> status code` (§7.3). |
| **Alternativas consideradas** | `Result<T, E>` consistente em todas as camadas — mais explícito sobre quais operações podem falhar, mas obriga cada caso de uso e cada controller a desembrulhar o resultado (`if (resultado.sucesso) ...`), e exigiria um segundo mecanismo de erro para falhas verdadeiramente excepcionais (já que `Result` não captura, por natureza, erros de infraestrutura). |
| **Consequências** | Positivo: um único ponto de mapeamento de erro para HTTP; código de caso de uso linear (sem desembrulhar `Result` a cada chamada); mensagem e código de regra sempre viajam juntos no objeto de erro. Negativo: erros de negócio esperados (ex.: "carga sem documentação") usam o mesmo mecanismo de exceção que falhas de infraestrutura — mitigado pela distinção explícita via `tipo` (`validacao`/`naoEncontrado`/`conflito`/`regra`) nunca confundida com um erro não tipado (`ERRO_INTERNO`). |

## ADR-13 — Máquina de status da Fase 2 substitui a da Fase 1

| | |
|---|---|
| **Contexto** | A Fase 1 modelou 6 status para `Carga Química` — o segundo deles cobrindo a etapa de conferência documental, nomeado com um identificador mais longo — com `Liberada` e `Cancelada` como terminais e bloqueio alcançável a partir dos dois primeiros estados. O PDF da Fase 2 exige explicitamente 8 status (`Registrada, EmAnalise, EmInspecao, Liberada, Bloqueada, EmMovimentacao, Finalizada, Cancelada`), com exatamente 11 transições permitidas, `Bloqueada` alcançável somente a partir de `EmInspecao`, e terminais apenas `Finalizada`/`Cancelada`. |
| **Decisão** | O modelo de status da Fase 2 **substitui integralmente** o da Fase 1. O estado de conferência documental foi renomeado para `EmAnalise`; `EmMovimentacao` e `Finalizada` foram adicionados; a transição direta dos dois primeiros estados para `Bloqueada` foi removida (bloqueio só a partir de `EmInspecao`); `Liberada` passou a transicionar para `EmMovimentacao` em vez de ser terminal; o cancelamento pós-liberação, antes citado como "fase futura", passou a ser suportado (`Liberada → Cancelada`). Todos os documentos de domínio da Fase 1 citados em §4 das instruções da Fase 2 foram atualizados para refletir isso; nenhum código ou teste usa o identificador antigo. |
| **Alternativas consideradas** | Manter os dois modelos lado a lado (6 status "conceituais" da Fase 1 documentados como históricos, 8 status "reais" no código) — rejeitado: geraria divergência permanente entre documentação e implementação, o oposto do objetivo de manter os docs como fonte de verdade. |
| **Consequências** | Positivo: um único modelo de status, testável via a tabela de transições (`transicoes.ts`) e cobrindo os 64 pares possíveis via `it.each`. Negativo: qualquer leitor que tenha visto a Fase 1 precisa ser avisado da mudança — por isso cada documento afetado carrega uma nota de "Histórico de alterações" no topo, apontando para este ADR. |

## ADR-14 — Estratégia de testes de integração

| | |
|---|---|
| **Contexto** | `qualidade.md` da Fase 1 previa testes de integração como "próximas fases". A Fase 2 exige persistência e API reais, então eles precisam existir de fato — mas sem duplicar a lógica de negócio já coberta pelos testes de domínio/aplicação (§12.1). |
| **Decisão** | Dois níveis de teste de integração: (1) um **contrato de repositório compartilhado** (`tests/integration/persistence/carga-quimica-repository.contract.ts`), executado contra o fake em memória (sempre) e contra `PrismaCargaQuimicaRepository` (quando `DATABASE_URL_TEST` está definida — localmente via `docker compose up -d db`, no CI via *service container*); (2) testes HTTP (`tests/integration/http/*.http.spec.ts`) via `buildServer(container)` + `app.inject`, verificando status code, formato do payload e o contrato único de erro — nunca reafirmando uma regra de negócio já testada em `tests/unit/domain`. |
| **Alternativas consideradas** | Testar a API só via `supertest` contra um servidor HTTP real (porta de rede aberta) — funciona, mas é mais lento e picha a inicialização/finalização de servidor a cada teste; `app.inject` do próprio Fastify evita abrir socket e é oficialmente recomendado pelo framework para este cenário. |
| **Consequências** | Positivo: a mesma bateria de asserções valida que o repositório Prisma respeita exatamente o contrato que os casos de uso esperam (ver `ICargaQuimicaRepository`), sem reescrever teste para cada implementação; testes HTTP continuam rápidos (sem rede real). Negativo: em ambientes sem PostgreSQL acessível (como o usado para esta implementação — ver relatório final do agente), a metade dos testes de contrato que depende de banco real fica pulada automaticamente (`describe.skipIf`), precisando ser confirmada depois em CI. |

## ADR-15 — Fronteiras entre camadas aplicadas por ferramenta, não por convenção

| | |
|---|---|
| **Contexto** | ADR-01 definiu a regra de dependência entre camadas, mas uma regra só documentada pode ser violada por descuido (um import de conveniência, um `any` que esconde o tipo errado) sem que ninguém note até muito depois. |
| **Decisão** | `eslint-plugin-boundaries` no `eslint.config.js`, com elementos mapeados para `domain`, `application`, `infrastructure`, `interfaces`, `shared` e `composition-root` (`main.ts`/`container.ts`), e políticas que só permitem a direção de dependência do ADR-01. Um `no-restricted-imports` adicional bane `fastify`, `@prisma/client`, `zod` e `pino` dentro de `domain/` e `application/`. O mesmo `npm run lint` roda no CI (`.github/workflows/ci.yml`) e falha o build em qualquer violação. |
| **Alternativas consideradas** | `dependency-cruiser` — ferramenta equivalente, mais focada em gerar grafos de dependência visuais; `eslint-plugin-boundaries` foi preferido por já rodar dentro do mesmo pipeline de lint (`eslint .`), sem uma segunda ferramenta/configuração separada para manter. |
| **Consequências** | Positivo: uma tentativa de import inválido (ex.: `domain/` importando `infrastructure/`) é pega localmente (editor/lint) e no CI, antes de chegar a um PR; comprovado durante a implementação (§M2 do plano de execução) ao importar `infrastructure` de dentro de `domain` só para confirmar que a regra falha. Negativo: a configuração do plugin exige manter `settings.boundaries/elements` sincronizada com a estrutura de pastas — um novo diretório de alto nível em `src/` precisa ser adicionado à lista. |