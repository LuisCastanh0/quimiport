# QuimiPort

Sistema para gestão inicial de cargas químicas em ambiente portuário, inspirado nas operações do Porto de Santos.

> **Fase atual: Fase 1 — Fundamentos, Domínio e Arquitetura.**
> Esta entrega **não** contém aplicação funcional (sem frontend, backend ou banco de dados implementados). O objetivo é estabelecer a base técnica — domínio, regras de negócio e arquitetura — que será evoluída nas próximas fases.

## Contexto do problema

O Porto de Santos é um dos principais pontos de movimentação de cargas do Brasil. Entre os diversos tipos de carga, produtos químicos exigem controle cuidadoso: documentação adequada, classificação de risco e acompanhamento técnico.

Hoje, esse controle é feito de forma manual ou descentralizada, o que dificulta a consulta de informações, o acompanhamento do status das cargas e a validação de regras de segurança.

## Objetivo da aplicação

O QuimiPort é um sistema para gestão de cargas químicas portuárias que permite:

- Cadastrar produtos químicos;
- Registrar cargas químicas e associá-las a um produto;
- Informar classificação de risco;
- Registrar documentação obrigatória;
- Definir responsável técnico;
- Acompanhar o status da carga;
- Bloquear ou liberar uma carga conforme regras de negócio;
- Validar regras de segurança antes da liberação para movimentação.

## Navegação pela documentação

| Documento | Conteúdo |
|---|---|
| [`docs/dominio.md`](docs/dominio.md) | Entendimento do domínio, usuários, linguagem ubíqua, entidades, objetos de valor e agregados |
| [`docs/casos-de-uso.md`](docs/casos-de-uso.md) | Casos de uso planejados (objetivo, ator, entradas/saídas, regras e exceções) |
| [`docs/regras-de-negocio.md`](docs/regras-de-negocio.md) | Regras de negócio consolidadas e onde ficam concentradas na arquitetura |
| [`docs/arquitetura.md`](docs/arquitetura.md) | Arquitetura proposta, camadas, responsabilidades e organização do projeto |
| [`docs/typescript-javascript.md`](docs/typescript-javascript.md) | Decisões de uso de TypeScript e JavaScript Avançado |
| [`docs/decisoes-arquiteturais.md`](docs/decisoes-arquiteturais.md) | Decisões arquiteturais e roadmap de evolução (backend, frontend, mobile, microsserviços) |
| [`docs/qualidade.md`](docs/qualidade.md) | Plano de qualidade de software e cenários de teste planejados |
| [`docs/diagramas/`](docs/diagramas/) | Diagrama de domínio (agregados/entidades) e fluxo de transição de status da carga, entre outros |

## Estrutura do repositório

```
quimiport/
├── README.md
└── docs/
    ├── dominio.md
    ├── casos-de-uso.md
    ├── regras-de-negocio.md
    ├── arquitetura.md
    ├── typescript-javascript.md
    ├── decisoes-arquiteturais.md
    ├── qualidade.md
    └── diagramas/
        ├── dominio.md          # Diagrama de agregados/entidades (obrigatório)
        └── fluxo-status.md     # Fluxo de transição de status da carga (obrigatório)
```

## Equipe

| Nome | RM |
|---|---|
| Luis Gustavo Aguirre Castanho | rm375479 |

## Vídeo demonstrativo

_Link a ser adicionado após a gravação._