# Domínio — QuimiPort

Este documento cobre o entendimento do domínio e a modelagem com Domain-Driven Design (DDD): linguagem ubíqua, entidades, objetos de valor e agregados. Casos de uso e regras de negócio, também parte da modelagem DDD, estão detalhados em documentos próprios ([`casos-de-uso.md`](casos-de-uso.md) e [`regras-de-negocio.md`](regras-de-negocio.md)) e são referenciados aqui onde relevante.

## 1. Entendimento do domínio

### Qual problema o sistema pretende resolver?

No Porto de Santos, o registro de cargas químicas é hoje feito de forma manual ou descentralizada. Isso dificulta a consulta de informações, o acompanhamento do status de cada carga e a validação de regras de segurança antes da liberação para movimentação. O QuimiPort centraliza esse controle: cadastro de produtos químicos, registro de cargas, classificação de risco, documentação obrigatória, responsabilidade técnica e as validações de segurança que condicionam a liberação de uma carga.

### Quem são os usuários envolvidos?

| Perfil | Responsabilidade no sistema |
|---|---|
| **Operador portuário** | Registra a movimentação física da carga e consulta o status/liberação antes de movimentá-la. |
| **Responsável técnico** | Assume tecnicamente uma carga química; sua assinatura/registro é pré-requisito para liberação. |
| **Analista de documentação** | Cadastra e valida a documentação obrigatória associada a cada carga. |
| **Analista de qualidade** | Solicita e registra inspeções, avalia conformidade da carga com as regras de segurança. |
| **Gestor operacional** | Acompanha o status das cargas, aprova bloqueios/liberações e consulta indicadores e histórico. |
| **Administrador do sistema** | Cadastra e inativa produtos químicos, gerencia usuários e parâmetros do sistema (classes de risco, tipos de documento). |

### Quais informações precisam ser controladas?

- Cadastro de produtos químicos (identificação, classificação de risco, status ativo/inativo);
- Cargas químicas e o produto ao qual cada uma está associada;
- Quantidade movimentada por carga;
- Classificação de risco da carga;
- Documentação obrigatória (tipo, validade, status de conformidade);
- Responsável técnico vinculado a cada carga;
- Status da carga e seu histórico de transições;
- Registros de inspeção;
- Área de armazenamento da carga, quando aplicável.

### Quais processos fazem parte da operação?

1. Cadastro e manutenção de produtos químicos (ativação/inativação);
2. Registro de uma nova carga química, associada a um produto ativo;
3. Classificação de risco da carga;
4. Anexação e validação da documentação obrigatória;
5. Definição do responsável técnico;
6. Solicitação e registro de inspeção;
7. Avaliação das regras de segurança para decidir liberação ou bloqueio;
8. Acompanhamento do status até a liberação para movimentação portuária (ou cancelamento).

### Quais decisões precisam ser tomadas pelo sistema?

- Se um produto químico pode ser cadastrado (dados obrigatórios presentes);
- Se uma carga pode ser registrada, dado o estado do produto associado (ativo/inativo);
- Se a documentação apresentada é suficiente para liberar a carga;
- Se a carga pode transicionar de um status para outro (ex.: de "em inspeção" para "liberada");
- Se uma carga deve ser bloqueada por não atender a alguma regra de segurança;
- Se uma carga bloqueada ou cancelada pode ou não seguir para movimentação.

### Quais riscos ou restrições precisam ser considerados?

- Liberar uma carga sem toda a documentação obrigatória valida configura risco de segurança e de conformidade regulatória;
- Produtos inativados não podem originar novas cargas, para evitar uso de classificações desatualizadas;
- Cargas bloqueadas ou canceladas não podem ser movimentadas, sob risco operacional;
- O sistema depende de que o responsável técnico esteja corretamente vinculado antes da liberação — ausência de responsabilidade formal é uma restrição regulatória do domínio portuário;
- Nesta fase, não há integração com sistemas externos (ex.: órgãos reguladores, sistemas do porto), o que é uma restrição de escopo, não de negócio.

### Quais partes do sistema poderão evoluir nas próximas fases?

- Implementação de frontend, backend e persistência (esta fase entrega apenas domínio e arquitetura);
- Integração com sistemas externos (órgãos ambientais, autoridade portuária, rastreamento de embarcações);
- Autenticação e controle de acesso por perfil de usuário;
- Notificações automáticas (ex.: documentação prestes a vencer, carga pendente de inspeção);
- Consulta e relatórios avançados (indicadores, auditoria, histórico completo);
- Regras de compatibilidade química entre cargas em uma mesma área de armazenamento;
- Evolução para microsserviços, conforme o domínio crescer (ver [`decisoes-arquiteturais.md`](decisoes-arquiteturais.md)).

## 2. Linguagem ubíqua

| Termo | Significado no domínio |
|---|---|
| **Produto Químico** | Substância catalogada no sistema, com classificação de risco própria, que pode ser referenciada por uma ou mais cargas. |
| **Carga Química** | Remessa física de um produto químico, com quantidade, documentação, responsável técnico e status próprios. É o agregado central do domínio. |
| **Classificação de Risco** | Categoria de periculosidade de um produto ou carga (ex.: classe ONU de risco), determinante para as exigências documentais e de manuseio. |
| **Documentação Obrigatória** | Conjunto de documentos exigidos para que uma carga possa ser liberada (ex.: ficha de segurança, laudo técnico, licença de transporte). |
| **Responsável Técnico** | Profissional habilitado que assume formalmente a responsabilidade técnica por uma carga. |
| **Inspeção** | Verificação técnica realizada sobre uma carga para atestar sua conformidade antes da liberação. |
| **Status da Carga** | Estado atual da carga no fluxo operacional (ex.: registrada, em validação documental, em inspeção, liberada, bloqueada, cancelada). Ver [`diagramas/fluxo-status.md`](diagramas/fluxo-status.md). |
| **Liberação** | Ato de autorizar uma carga para movimentação portuária, condicionado ao cumprimento de todas as regras de segurança. |
| **Bloqueio** | Ato de impedir a movimentação de uma carga por descumprimento de alguma regra de negócio ou de segurança. |
| **Área de Armazenamento** | Local físico do porto onde uma carga pode ser mantida até sua liberação. |
| **Movimentação Portuária** | Deslocamento físico da carga dentro do porto, permitido somente após liberação. |

## 3. Entidades

### Produto Químico

| Campo | Descrição |
|---|---|
| **Responsabilidade** | Representar um produto químico catalogado, com sua classificação de risco e status de disponibilidade para uso em novas cargas. |
| **Atributos principais** | `id`, `nome`, `classificacaoRisco` (VO), `status` (`Ativo` \| `Inativo`), `descricao` |
| **Regras relacionadas** | Não pode ser cadastrado sem nome; não pode ser cadastrado sem classe de risco; uma vez inativo, não pode ser associado a novas cargas. |
| **Relacionamentos** | Um Produto Químico pode ser referenciado por múltiplas Cargas Químicas (1:N). |

### Carga Química *(raiz do agregado)*

| Campo | Descrição |
|---|---|
| **Responsabilidade** | Concentrar o ciclo de vida de uma carga: produto associado, quantidade, documentação, responsável técnico, inspeções, status e histórico. É a raiz de agregado que garante a consistência de todas essas regras em conjunto. |
| **Atributos principais** | `id`, `produtoQuimicoId`, `quantidade` (VO), `classificacaoRisco` (VO), `status` (VO/enum), `responsavelTecnicoId`, `aceiteResponsavelTecnico` (data/hora da confirmação formal do responsável técnico), `documentos` (lista de Documento da Carga), `inspecoes` (lista de Inspeção), `areaArmazenamentoId`, `historicoStatus` |
| **Regras relacionadas** | Não pode ser registrada sem produto associado; não pode ser registrada com produto inativo; não pode ser registrada sem classificação de risco; não pode ser liberada sem documentação obrigatória válida; não pode ser liberada sem que o responsável técnico tenha confirmado formalmente a responsabilidade pela carga (ver UC12 em [`casos-de-uso.md`](casos-de-uso.md)); carga bloqueada não pode ser movimentada; carga cancelada não pode ser liberada; quantidade deve ser maior que zero. (Lista completa em [`regras-de-negocio.md`](regras-de-negocio.md).) |
| **Relacionamentos** | Referencia um Produto Químico (N:1), um Responsável Técnico (N:1), possui Documentos da Carga (1:N) e Inspeções (1:N), e pode referenciar uma Área de Armazenamento (N:1). |

### Responsável Técnico

| Campo | Descrição |
|---|---|
| **Responsabilidade** | Representar o profissional habilitado que assume formalmente a responsabilidade técnica por uma ou mais cargas. |
| **Atributos principais** | `id`, `nome`, `registroProfissional` (VO), `especialidade` |
| **Regras relacionadas** | Toda carga deve possuir um responsável técnico informado; o responsável técnico deve confirmar formalmente a responsabilidade pela carga (assumir tecnicamente) antes de ela ser liberada — ação modelada como caso de uso próprio (ver UC12 em [`casos-de-uso.md`](casos-de-uso.md)). |
| **Relacionamentos** | Um Responsável Técnico pode estar vinculado a múltiplas Cargas Químicas (1:N). |

### Documento da Carga

| Campo | Descrição |
|---|---|
| **Responsabilidade** | Representar um documento obrigatório apresentado para uma carga (ex.: ficha de segurança, laudo, licença), controlando sua validade e conformidade. |
| **Atributos principais** | `id`, `tipoDocumento`, `numero`, `periodoValidade` (VO), `statusValidacao` (`Pendente` \| `Válido` \| `Inválido`) |
| **Regras relacionadas** | Uma carga não pode ser liberada sem que todos os documentos obrigatórios estejam presentes e válidos. |
| **Relacionamentos** | Pertence a exatamente uma Carga Química (parte do agregado, sem identidade própria fora dele). |

### Inspeção

| Campo | Descrição |
|---|---|
| **Responsabilidade** | Registrar a verificação técnica realizada sobre uma carga, com resultado e parecer, antes da liberação. |
| **Atributos principais** | `id`, `dataInspecao`, `inspetorResponsavel`, `resultado` (`Aprovada` \| `Reprovada` \| `Pendente`), `parecer` |
| **Regras relacionadas** | Uma carga em inspeção não pode ser finalizada sem antes ser liberada (a inspeção reprovada mantém ou leva a carga a bloqueio). |
| **Relacionamentos** | Pertence a exatamente uma Carga Química (parte do agregado). |

### Área de Armazenamento

| Campo | Descrição |
|---|---|
| **Responsabilidade** | Representar o local físico do porto onde uma carga pode ser mantida enquanto aguarda liberação. |
| **Atributos principais** | `id`, `codigo`, `capacidade`, `restricoes` (ex.: compatibilidade com classes de risco) |
| **Regras relacionadas** | Nesta fase, associação simples a uma carga; regras de compatibilidade química entre cargas na mesma área ficam previstas para fases futuras. |
| **Relacionamentos** | Uma Área de Armazenamento pode abrigar múltiplas Cargas Químicas (1:N); tratada como entidade/agregado independente, referenciada pela Carga Química por identidade (`areaArmazenamentoId`), não como parte do seu agregado. |

## 4. Objetos de valor

Objetos de valor não possuem identidade própria: são definidos pelos seus atributos e são imutáveis.

| Objeto de valor | Atributos | Usado em |
|---|---|---|
| **ClassificacaoRisco** | `classeRisco` (ex.: classe ONU), `categoriaPerigo` | Produto Químico, Carga Química |
| **Quantidade** | `valor` (número > 0), `unidadeMedida` (ex.: `kg`, `L`, `ton`) | Carga Química |
| **RegistroProfissional** | `numero`, `orgaoEmissor` (ex.: CRQ/CREA) | Responsável Técnico |
| **PeriodoValidade** | `dataEmissao`, `dataValidade` | Documento da Carga |
| **StatusCarga** | Valor fechado dentre os estados válidos do fluxo (ver [`diagramas/fluxo-status.md`](diagramas/fluxo-status.md)) | Carga Química |

## 5. Agregados

### Carga Química — agregado principal

A **Carga Química** foi escolhida como raiz de agregado porque é o elemento do domínio que precisa garantir consistência transacional entre várias informações relacionadas ao mesmo tempo: o produto associado, a quantidade, a documentação apresentada, o responsável técnico, o histórico de inspeções e o status atual. Nenhuma dessas informações faz sentido de forma isolada — todas as decisões de negócio (liberar, bloquear, cancelar) dependem de avaliá-las em conjunto.

O agregado protege, entre outras, as regras de que:

- a carga não existe sem um produto químico ativo associado;
- a transição de status (ex.: para "Liberada") só ocorre se documentação e responsável técnico estiverem completos;
- o histórico de status é sempre consistente com as transições permitidas;
- bloqueios e cancelamentos são estados terminais/restritivos que impedem movimentação.

**Documento da Carga** e **Inspeção** são entidades internas ao agregado — só existem no contexto de uma Carga Química e são acessadas através dela, nunca diretamente.

**Produto Químico**, **Responsável Técnico** e **Área de Armazenamento** são tratados como agregados independentes, com seu próprio ciclo de vida, e são referenciados pela Carga Química por identidade (`id`), e não incluídos dentro do agregado — isso evita que o agregado de Carga Química cresça demais e mantém cada ciclo de vida (ex.: inativação de um produto) desacoplado das cargas que o referenciam.

## 6. Casos de uso e regras de negócio

Os casos de uso e as regras de negócio detalhados fazem parte da modelagem DDD, mas são tratados em documentos dedicados para manter este documento focado no domínio:

- [`casos-de-uso.md`](casos-de-uso.md) — objetivo, ator, entradas/saídas, regras e exceções de cada caso de uso;
- [`regras-de-negocio.md`](regras-de-negocio.md) — regras consolidadas e onde cada uma fica concentrada na arquitetura.