# Diagrama de Entidades e Relacionamentos — Físico (Fase 2)

Este é o ER **físico**: schema real do PostgreSQL, gerado a partir de [`../../prisma/schema.prisma`](../../prisma/schema.prisma). Complementa o [ER conceitual da Fase 1](entidade-relacionamento.md) — ver a diferença entre os dois na seção final daquele documento. Detalhamento de cada coluna em [`../modelagem-de-dados.md`](../modelagem-de-dados.md).

## Diagrama

```mermaid
erDiagram
    PRODUTOS_QUIMICOS {
        uuid id PK
        text nome
        text descricao
        text numero_onu
        varchar classe_risco "CHECK 1-9"
        text grupo_compatibilidade
        status_produto status
        timestamptz created_at
        timestamptz updated_at
    }

    RESPONSAVEIS_TECNICOS {
        uuid id PK
        text nome
        text registro_numero
        text registro_orgao
        text especialidade
        timestamptz created_at
        timestamptz updated_at
    }

    CARGAS_QUIMICAS {
        uuid id PK
        text codigo "UNIQUE"
        uuid produto_quimico_id FK
        numeric quantidade_valor "CHECK > 0"
        unidade_medida unidade_medida
        text origem
        text destino
        uuid responsavel_tecnico_id FK
        varchar classe_risco "CHECK 1-9"
        status_carga status "8 valores"
        timestamptz aceite_responsavel_tecnico_em
        timestamptz data_entrada
        int version
        timestamptz created_at
        timestamptz updated_at
    }

    DOCUMENTOS_CARGA {
        uuid id PK
        uuid carga_id FK
        tipo_documento tipo
        text numero
        timestamptz data_emissao
        timestamptz data_validade
        status_validacao_documento status_validacao
        timestamptz created_at
        timestamptz updated_at
    }

    INSPECOES {
        uuid id PK
        uuid carga_id FK
        timestamptz data_inspecao
        text inspetor_responsavel
        resultado_inspecao resultado
        text parecer
        timestamptz created_at
        timestamptz updated_at
    }

    HISTORICO_STATUS_CARGA {
        uuid id PK
        uuid carga_id FK
        status_carga status_anterior "nullable"
        status_carga status_novo
        text motivo
        timestamptz ocorrido_em
    }

    AREAS_ARMAZENAMENTO {
        uuid id PK
        text codigo "UNIQUE"
        numeric capacidade
        text restricoes
    }

    PRODUTOS_QUIMICOS ||--o{ CARGAS_QUIMICAS : "RESTRICT"
    RESPONSAVEIS_TECNICOS ||--o{ CARGAS_QUIMICAS : "RESTRICT"
    CARGAS_QUIMICAS ||--o{ DOCUMENTOS_CARGA : "CASCADE"
    CARGAS_QUIMICAS ||--o{ INSPECOES : "CASCADE"
    CARGAS_QUIMICAS ||--o{ HISTORICO_STATUS_CARGA : "CASCADE"
```

## Leitura

- As FKs de `CARGAS_QUIMICAS` para `PRODUTOS_QUIMICOS`/`RESPONSAVEIS_TECNICOS` são `ON DELETE RESTRICT`: nunca há exclusão física de produto/RT referenciado (consistente com o domínio nunca fazer hard delete).
- As FKs de `DOCUMENTOS_CARGA`/`INSPECOES`/`HISTORICO_STATUS_CARGA` para `CARGAS_QUIMICAS` são `ON DELETE CASCADE`, espelhando que essas três são, no domínio, partes do agregado `Carga Química` (entidades internas ou histórico) — nunca existem sem uma carga.
- `AREAS_ARMAZENAMENTO` existe como tabela independente, mas ainda sem FK de `CARGAS_QUIMICAS` nesta fase (ver "como os dados podem evoluir" em [`../modelagem-de-dados.md`](../modelagem-de-dados.md)).
- Enums Postgres (`status_produto`, `status_carga`, `unidade_medida`, `tipo_documento`, `status_validacao_documento`, `resultado_inspecao`) garantem, no nível do banco, os conjuntos fechados de valores; `classe_risco` é `VARCHAR(1)` + `CHECK` em vez de enum (ver justificativa em [`../modelagem-de-dados.md`](../modelagem-de-dados.md), seção 5).
