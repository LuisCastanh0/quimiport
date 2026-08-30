# QuimiPort

Sistema para gestão inicial de cargas químicas em ambiente portuário, inspirado nas operações do Porto de Santos.

> **Fase 1 — Fundamentos, Domínio e Arquitetura.**
> Esta entrega **não** contém aplicação funcional. O foco é estruturar a base (domínio, regras de negócio e arquitetura) para evoluir nas próximas fases sem precisar retrabalhar o que já foi definido.

## Equipe

| Nome | RM |
|---|---|
| Luis Gustavo Aguirre Castanho | rm375479 |


## Contexto do problema

O Porto de Santos é um dos principais pontos de movimentação de cargas do Brasil, e entre os diversos tipos de carga que passam por lá, os produtos químicos são os que exigem mais cuidado: documentação adequada, classificação de risco e acompanhamento técnico.

Na prática, esse controle ainda é feito de forma manual ou descentralizada em boa parte dos casos, o que dificulta consultar informações rapidamente, acompanhar o status de cada carga e validar as regras de segurança antes de liberar a movimentação.

## Objetivo da aplicação

A ideia é que o QuimiPort seja um sistema de gestão de cargas químicas portuárias capaz de:

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
| [`docs/diagramas/`](docs/diagramas/) | Diagrama de domínio (agregados/entidades), fluxo de transição de status da carga, entre outros |

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
        ├── dominio.md  # Diagrama de agregados/entidades
        ├── fluxo-status.md
        ├── entidade-relacionamento.md
        └── contexto.md
        
```