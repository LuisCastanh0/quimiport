# Decisões Arquiteturais — QuimiPort

Este documento cobre a seção 10 do PDF do Tech Challenge: as principais decisões arquiteturais do projeto, registradas no formato de ADR (*Architecture Decision Record*) — Contexto, Decisão, Alternativas consideradas e Consequências. Onde a decisão já foi aplicada em outro documento, este ADR referencia o local e foca no "porquê"; não repete o que já foi descrito estruturalmente.

## ADR-01 — Separar domínio, aplicação e infraestrutura em camadas

| | |
|---|---|
| **Contexto** | O QuimiPort concentra regras de segurança e conformidade (RN01–RN13) que precisam ser confiáveis e testáveis isoladamente, e o projeto será evoluído por várias fases (frontend, backend, banco de dados, possivelmente microsserviços). |
| **Decisão** | Separar o código em quatro camadas — `Domain`, `Application`, `Infrastructure`, `Interfaces` — com dependência sempre apontando para dentro, conforme detalhado em [`arquitetura.md`](arquitetura.md). |
| **Alternativas consideradas** | (a) Estrutura única por *feature*, sem separação de camadas — mais rápida para prototipar, mas mistura regra de negócio com detalhes de persistência/apresentação, dificultando testar o domínio isoladamente e trocar peças de infraestrutura depois. (b) MVC clássico — mais simples, porém tende a acumular regra de negócio no controller ou no model ligado ao banco, contrariando o objetivo de negócio-primeiro do desafio. |
| **Consequências** | Positivo: domínio testável sem infraestrutura, trocas de tecnologia (banco, framework web) não tocam a regra de negócio, curva de entendimento clara para quem entra no projeto depois. Negativo: mais arquivos e indireção do que uma estrutura simples, custo que só se paga em um projeto que de fato vai evoluir — o que é exatamente o caso aqui. |

## ADR-02 — Concentrar regras de negócio no domínio, não nos casos de uso

| | |
|---|---|
| **Contexto** | As mesmas regras (ex.: "produto inativo não pode originar carga") podem ser checadas tanto dentro do agregado quanto no início do caso de uso que o invoca. |
| **Decisão** | Regras de negócio (invariantes) vivem dentro dos agregados/entidades do domínio (`CargaQuimica`, `ProdutoQuimico`, ...), nunca nos casos de uso — detalhado em [`regras-de-negocio.md`](regras-de-negocio.md), coluna "Camada/local de concentração". Casos de uso orquestram: buscam dados via repositório e chamam métodos do domínio. |
| **Alternativas consideradas** | Regras nos casos de uso (camada de aplicação) — mais direto de ler em um primeiro momento, mas duplica validação sempre que a mesma regra precisa valer em mais de um ponto de entrada (ex.: API REST e uma futura importação em lote), e permite criar um agregado em estado inválido caso algum código chame o construtor sem passar pelo caso de uso. |
| **Consequências** | Positivo: é impossível colocar `CargaQuimica` em estado inválido, não importa por onde ela seja criada/alterada — a garantia é no próprio tipo. Positivo: testes de regra de negócio não precisam simular toda a camada de aplicação. Negativo: exige disciplina para não "vazar" validação de volta para os casos de uso por conveniência. |

## ADR-03 — Utilizar TypeScript

| | |
|---|---|
| **Contexto** | O domínio do QuimiPort tem muitos conceitos com identidade e regras de transição de estado (status, classificação de risco, documentação obrigatória) que, em JavaScript puro, dependeriam só de disciplina e testes para não serem usados incorretamente. |
| **Decisão** | Implementar o QuimiPort em TypeScript, com `strict` habilitado, conforme detalhado em [`typescript-javascript.md`](typescript-javascript.md). |
| **Alternativas consideradas** | JavaScript puro com validação em runtime (ex.: biblioteca de schema) — funciona, mas move erros que poderiam ser pegos em tempo de compilação para o tempo de execução, e não documenta os contratos entre camadas no próprio código. |
| **Consequências** | Positivo: interfaces de repositório, DTOs e enums de status tornam os contratos entre camadas explícitos e verificáveis pelo compilador; refatoração é mais segura à medida que o projeto cresce nas próximas fases. Negativo: overhead de configuração (tsconfig, build) e uma curva de aprendizado para quem não é familiarizado com tipagem estática — aceitável dado que é também um objetivo de aprendizado desta fase do curso. |

## ADR-04 — Evolução para backend

| | |
|---|---|
| **Contexto** | Nesta fase não há API implementada; os casos de uso já existem como classes isoladas na camada `Application`. |
| **Decisão** | O backend entra como um novo adaptador na camada `Interfaces` (ex.: `interfaces/http/`), com controllers finos que apenas convertem requisição HTTP → DTO de entrada do caso de uso, chamam `usecase.executar()`, e convertem a saída em resposta HTTP. Nenhuma regra de negócio é escrita no controller. |
| **Alternativas consideradas** | Escrever a API diretamente acoplada aos casos de uso sem camada de adaptação — reduz um passo de indireção, mas acopla o formato de requisição/resposta HTTP ao contrato interno do caso de uso, dificultando reuso por outro tipo de cliente (ex.: mobile) no futuro. |
| **Consequências** | Os casos de uso já modelados nesta fase (UC01–UC12) não precisam mudar quando o backend for implementado — só ganham um adaptador HTTP na frente. |

## ADR-05 — Evolução para frontend

| | |
|---|---|
| **Contexto** | Nenhum frontend é entregue nesta fase; o domínio e os casos de uso não conhecem a existência de uma interface visual. |
| **Decisão** | O frontend (web) consumirá a futura API REST (ADR-04) como qualquer outro cliente HTTP — não terá acesso direto ao domínio ou à infraestrutura do QuimiPort. A escolha de framework de frontend fica em aberto para a fase em que ele for de fato implementado. |
| **Alternativas consideradas** | Monorepo com frontend importando tipos/DTOs diretamente do backend TypeScript — pode ser reavaliado como otimização futura (tipos compartilhados via pacote interno), mas não é uma decisão necessária nesta fase. |
| **Consequências** | O frontend pode começar a ser desenvolvido em paralelo ao backend assim que os contratos de DTO estiverem estáveis, usando os documentos de casos de uso ([`casos-de-uso.md`](casos-de-uso.md)) como especificação de tela por caso de uso. |

## ADR-06 — Evolução para mobile

| | |
|---|---|
| **Contexto** | Um app mobile, se vier a existir, precisa dos mesmos casos de uso que o backend já expõe via API REST. |
| **Decisão** | O app mobile é tratado como mais um cliente da mesma API REST usada pelo frontend web (ADR-04/ADR-05) — nenhuma nova camada de aplicação ou domínio é criada especificamente para mobile. |
| **Alternativas consideradas** | API dedicada para mobile (ex.: *backend for frontend*) — só se justificaria se as necessidades de dados do app mobile divergirem muito das do frontend web (ex.: payloads reduzidos para rede móvel); não há indício disso nesta fase. |
| **Consequências** | Menor superfície para manter; se a divergência aparecer nas próximas fases, um *backend for frontend* pode ser adicionado como um novo adaptador em `Interfaces`, sem alterar `Application` nem `Domain`. |

## ADR-07 — Evolução para microsserviços

| | |
|---|---|
| **Contexto** | O domínio já está dividido em agregados independentes (`CargaQuimica`, `ProdutoQuimico`, `ResponsavelTecnico`, `AreaArmazenamento`), referenciados entre si por identificador, não por composição — ver [diagrama de domínio](diagramas/dominio.md). |
| **Decisão** | Nesta fase, o QuimiPort permanece um **monólito modular** (todas as camadas em um único deployável). Cada agregado, por já ser desacoplado dos demais (referência por ID, sem transação compartilhada entre agregados), é um candidato natural a virar um serviço independente numa fase futura, se a necessidade de escala ou de times separados justificar. |
| **Alternativas consideradas** | Começar já com microsserviços separados por agregado — rejeitado nesta fase: adicionaria complexidade de comunicação distribuída (rede, consistência eventual, versionamento de contrato entre serviços) sem um problema real de escala que a justifique. É complexidade prematura para o estágio atual do projeto. |
| **Consequências** | A divisão em módulos por agregado hoje (pastas separadas em `domain/`, casos de uso isolados por operação) é o que torna essa migração futura viável sem reescrever o domínio — o próprio ADR-01/ADR-02 são o que preparam esse caminho. |

## ADR-08 — Como evitar acoplamento excessivo

| | |
|---|---|
| **Contexto** | Um sistema com várias entidades inter-relacionadas (produto, carga, responsável, documentos, inspeção) corre o risco de cada parte conhecer detalhes internos das outras, dificultando mudanças isoladas. |
| **Decisão** | Quatro mecanismos combinados: (1) regra de dependência entre camadas (ADR-01); (2) agregados referenciados por identificador, nunca por composição direta entre si (ver [diagrama de domínio](diagramas/dominio.md)); (3) portas/interfaces de repositório definidas no domínio e implementadas na infraestrutura (inversão de dependência); (4) um caso de uso por operação de negócio, em vez de serviços genéricos tipo `CargaService` com muitos métodos não relacionados. |
| **Alternativas consideradas** | Serviços de aplicação amplos por agregado (ex.: um único `CargaQuimicaService` com todos os métodos de UC03 a UC12) — mais simples de navegar no começo, mas tende a crescer sem limite claro e a acumular dependências desnecessárias entre operações que não têm relação entre si. |
| **Consequências** | Cada caso de uso tem exatamente as dependências que precisa (ex.: `LiberarCargaQuimica` só depende de `ICargaQuimicaRepository`), o que também facilita os testes unitários descritos em [`qualidade.md`](qualidade.md). |