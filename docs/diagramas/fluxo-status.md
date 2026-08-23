# Fluxo de Transição de Status da Carga Química

Diagrama obrigatório do Tech Challenge, representando o ciclo de vida do status da Carga Química (objeto de valor `StatusCarga`, definido em [`../dominio.md`](../dominio.md) e no [diagrama de domínio](dominio.md)). As transições seguem os casos de uso de [`../casos-de-uso.md`](../casos-de-uso.md) e são condicionadas pelas regras de negócio de [`../regras-de-negocio.md`](../regras-de-negocio.md).

## Estados

| Estado | Significado |
|---|---|
| `Registrada` | Carga criada (UC03), com produto ativo, classificação de risco, quantidade e responsável técnico informados. |
| `EmValidacaoDocumental` | Documentação obrigatória em conferência (UC04). |
| `EmInspecao` | Documentação validada; carga aguardando ou em processo de inspeção técnica (UC05). |
| `Liberada` | Carga aprovada em todas as validações, apta à movimentação portuária (UC06). |
| `Bloqueada` | Carga impedida de movimentação por descumprimento de regra de negócio/segurança (UC07). |
| `Cancelada` | Carga encerrada definitivamente, sem possibilidade de liberação (UC09). |

## Diagrama

```mermaid
stateDiagram-v2
    [*] --> Registrada : UC03 Registrar carga química\n(RN01, RN02/RN10, RN03, RN11, RN12)

    Registrada --> EmValidacaoDocumental : UC04 Iniciar validação\nde documentação

    EmValidacaoDocumental --> EmValidacaoDocumental : Documentação pendente\nou inválida
    EmValidacaoDocumental --> EmInspecao : UC04/UC05 Documentação\nválida (RN04)

    EmInspecao --> Liberada : UC06 Liberar carga química\nInspeção aprovada (RN07) +\nResponsável técnico com\naceite (RN12, RN13)
    EmInspecao --> Bloqueada : UC07 Bloquear carga química\n(inspeção reprovada)

    Registrada --> Bloqueada : UC07 Bloquear carga química\n(descumprimento de regra)
    EmValidacaoDocumental --> Bloqueada : UC07 Bloquear carga química\n(descumprimento de regra)

    Registrada --> Cancelada : UC09 Cancelar carga química
    EmValidacaoDocumental --> Cancelada : UC09 Cancelar carga química
    EmInspecao --> Cancelada : UC09 Cancelar carga química
    Bloqueada --> Cancelada : UC09 Cancelar carga química

    Liberada --> [*] : Apta à movimentação\nportuária (RN05, RN06)
    Cancelada --> [*]

    note right of Bloqueada
        Reversão de bloqueio (retorno a
        Registrada/EmValidacaoDocumental)
        não está no escopo desta fase.
        Ver dominio.md, "partes que
        poderão evoluir".
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

## Leitura do diagrama

O fluxo feliz é `Registrada → EmValidacaoDocumental → EmInspecao → Liberada`, condicionado pelas regras de gate já detalhadas em [`../regras-de-negocio.md`](../regras-de-negocio.md) (fluxograma de UC06). A partir de `Registrada` ou `EmValidacaoDocumental`, uma carga pode ser bloqueada (UC07) ou cancelada (UC09) a qualquer momento em que descumprir uma regra de negócio. A partir de `EmInspecao`, o resultado da inspeção decide entre `Liberada` (aprovada) e `Bloqueada` (reprovada) — nunca há um estado "finalizado" fora dessas duas opções, o que corresponde à regra RN07 ("uma carga em inspeção não pode ser finalizada sem antes ser liberada").

`Liberada` e `Cancelada` são estados terminais nesta fase: o cancelamento de uma carga já liberada e a reversão de um bloqueio não são tratados aqui — ambos ficam registrados como evolução futura em [`../dominio.md`](../dominio.md) ("Quais partes do sistema poderão evoluir nas próximas fases").