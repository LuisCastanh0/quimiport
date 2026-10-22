# Fluxo de Transição de Status da Carga Química

> **Histórico de alterações:** revisado na Fase 2 (ver ADR-13 em [`../decisoes-arquiteturais.md`](../decisoes-arquiteturais.md)) — o estado de conferência documental foi renomeado para `EmAnalise`; foram adicionados os estados `EmMovimentacao` e `Finalizada`; `Bloqueada` passou a ser alcançável apenas a partir de `EmInspecao`; `Liberada` deixou de ser terminal (agora segue para `EmMovimentacao`); os terminais passaram a ser exclusivamente `Finalizada` e `Cancelada`.

Diagrama representando o ciclo de vida do status da Carga Química (objeto de valor `StatusCarga`, definido em [`../dominio.md`](../dominio.md) e no [diagrama de domínio](dominio.md)). As transições seguem os casos de uso de [`../casos-de-uso.md`](../casos-de-uso.md) e são condicionadas pelas regras de negócio de [`../regras-de-negocio.md`](../regras-de-negocio.md).

## Estados

| Estado | Significado |
|---|---|
| `Registrada` | Carga criada (UC03), com produto ativo, classificação de risco, quantidade e responsável técnico informados. |
| `EmAnalise` | Documentação obrigatória em conferência (UC04). |
| `EmInspecao` | Documentação validada; carga aguardando ou em processo de inspeção técnica (UC05). |
| `Liberada` | Carga aprovada em todas as validações, apta à movimentação portuária (UC06). |
| `Bloqueada` | Carga impedida de movimentação por descumprimento de regra de negócio/segurança (UC07), somente a partir de `EmInspecao`. |
| `EmMovimentacao` | Carga liberada e em deslocamento físico dentro do porto. |
| `Finalizada` | Movimentação concluída; estado terminal. |
| `Cancelada` | Carga encerrada definitivamente, sem possibilidade de liberação (UC09); estado terminal. |

## Diagrama

```mermaid
stateDiagram-v2
    [*] --> Registrada : UC03 Registrar carga química\n(RN01, RN02/RN10, RN03, RN11, RN12)

    Registrada --> EmAnalise : UC04 Iniciar análise\nde documentação

    EmAnalise --> EmInspecao : UC04/UC05 Documentação\nválida (RN04, RN17)

    EmInspecao --> Liberada : UC06 Liberar carga química\nInspeção aprovada (RN07) +\nResponsável técnico com\naceite (RN12, RN13)
    EmInspecao --> Bloqueada : UC07 Bloquear carga química\n(inspeção reprovada)

    Liberada --> EmMovimentacao : Início da movimentação\nportuária
    EmMovimentacao --> Finalizada : UC08 Finalizar movimentação

    Registrada --> Cancelada : UC09 Cancelar carga química
    EmAnalise --> Cancelada : UC09 Cancelar carga química
    EmInspecao --> Cancelada : UC09 Cancelar carga química
    Liberada --> Cancelada : UC09 Cancelar carga química
    Bloqueada --> Cancelada : UC09 Cancelar carga química

    Finalizada --> [*]
    Cancelada --> [*]

    note right of Bloqueada
        Reversão de bloqueio (retorno a
        Registrada/EmAnalise/EmInspecao)
        não está no escopo desta fase.
        Bloqueada só é alcançável a
        partir de EmInspecao (RN14).
    end note

    note right of Liberada
        Uma carga Cancelada não pode
        ser Liberada (RN06); uma carga
        Bloqueada não pode ser
        movimentada (RN05) — por isso
        não há transição direta entre
        esses estados e Liberada.
    end note
```

## Tabela de transições permitidas (RN14)

Exatamente 11 transições são permitidas; qualquer outro par do produto cartesiano 8×8 (incluindo auto-transições) é proibido (`TRANSICAO_INVALIDA`):

| De | Para | Gate |
|---|---|---|
| Registrada | EmAnalise | — |
| EmAnalise | EmInspecao | Documentação obrigatória completa, válida e não vencida (RN04, RN17) |
| EmInspecao | Liberada | Documentação válida (RN04); inspeção mais recente `Aprovada` (RN07); RT vinculado e com aceite (RN12, RN13) |
| Liberada | EmMovimentacao | — |
| EmMovimentacao | Finalizada | — |
| Registrada | Cancelada | `motivo` obrigatório |
| EmAnalise | Cancelada | `motivo` obrigatório |
| EmInspecao | Cancelada | `motivo` obrigatório |
| Liberada | Cancelada | `motivo` obrigatório |
| Bloqueada | Cancelada | `motivo` obrigatório |
| EmInspecao | Bloqueada | `motivo` obrigatório |

## Leitura do diagrama

O fluxo feliz é `Registrada → EmAnalise → EmInspecao → Liberada → EmMovimentacao → Finalizada`, condicionado pelas regras de gate já detalhadas em [`../regras-de-negocio.md`](../regras-de-negocio.md) (fluxograma de UC06). A partir de `Registrada`, `EmAnalise`, `EmInspecao` ou `Liberada`, uma carga pode ser cancelada (UC09) a qualquer momento. Apenas a partir de `EmInspecao` uma carga pode ser bloqueada (UC07) — por inspeção reprovada ou decisão do Gestor Operacional. `Finalizada` e `Cancelada` são os únicos estados terminais (RN15): nenhuma transição de status, documento, inspeção ou aceite é permitida a partir deles.