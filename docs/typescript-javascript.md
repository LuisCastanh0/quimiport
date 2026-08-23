# TypeScript e JavaScript Avançado — QuimiPort

Este documento cobre a seção 9 do PDF do Tech Challenge: como JavaScript Avançado e TypeScript serão usados na construção futura do QuimiPort. As decisões aqui se aplicam às entidades, agregados e objetos de valor definidos em [`dominio.md`](dominio.md) e à estrutura de camadas de [`arquitetura.md`](arquitetura.md). Os exemplos são conceituais — servem para ilustrar a modelagem planejada, não são código de produção.

## Tipagem forte

`strict: true` no `tsconfig.json`, sem uso de `any`. Tipos explícitos nas fronteiras entre camadas (assinaturas de casos de uso, interfaces de repositório, DTOs de entrada/saída); dentro de uma função, o tipo pode ficar implícito quando o próprio TypeScript já garante segurança pela inferência. A ideia é que nenhum dado primitivo solto represente um conceito de negócio — por isso a quantidade de uma carga não é um `number` avulso, e sim o objeto de valor `Quantidade` (ver abaixo), que carrega sua própria validação.

## Interfaces

Usadas para dois propósitos principais:

1. **Portas de repositório**, definidas no domínio e implementadas na infraestrutura (ver [`arquitetura.md`](arquitetura.md)):

```typescript
interface ICargaQuimicaRepository {
  salvar(carga: CargaQuimica): Promise<void>;
  buscarPorId(id: string): Promise<CargaQuimica | null>;
  listarPorStatus(status: StatusCarga): Promise<CargaQuimica[]>;
}
```

2. **Contratos de entrada/saída dos casos de uso** (DTOs), que isolam o formato de dados trocado entre `application` e `interfaces` do modelo interno do domínio:

```typescript
interface RegistrarCargaQuimicaInput {
  produtoQuimicoId: string;
  quantidade: { valor: number; unidadeMedida: string };
  classificacaoRisco: { classeRisco: string; categoriaPerigo: string };
  responsavelTecnicoId: string;
}
```

## Classes

Reservadas para tipos que têm **identidade e comportamento próprio** — ou seja, as entidades e agregados de [`dominio.md`](dominio.md): `CargaQuimica`, `ProdutoQuimico`, `ResponsavelTecnico`, `AreaArmazenamento`, `DocumentoCarga`, `Inspecao`. Cada classe encapsula seus invariantes: nada fora dela altera o estado diretamente, tudo passa por métodos que reafirmam as regras de negócio (RN01–RN13).

```typescript
class CargaQuimica {
  private constructor(
    private readonly id: string,
    private readonly produtoQuimicoId: string,
    private quantidade: Quantidade,
    private status: StatusCarga,
    // ...demais campos
  ) {}

  static registrar(input: RegistrarCargaQuimicaInput, produto: ProdutoQuimico): CargaQuimica {
    if (produto.status !== "Ativo") {
      throw new CargaQuimicaError("RN02", "Produto químico inativo não pode originar carga.");
    }
    // demais validações (RN01, RN03, RN11, RN12) antes de instanciar
    return new CargaQuimica(/* ... */);
  }

  liberar(inspecaoAprovada: boolean, documentacaoValida: boolean, aceiteResponsavelTecnico: boolean): void {
    if (this.status === "Cancelada") {
      throw new CargaQuimicaError("RN06", "Carga cancelada não pode ser liberada.");
    }
    if (!documentacaoValida) {
      throw new CargaQuimicaError("RN04", "Carga sem documentação obrigatória válida.");
    }
    if (!inspecaoAprovada || !aceiteResponsavelTecnico) {
      throw new CargaQuimicaError("RN07_RN13", "Carga não atende aos pré-requisitos de liberação.");
    }
    this.status = "Liberada";
  }
}
```

Casos de uso também são classes, cada um com um único método de execução (padrão *Command*) — ver seção de generics abaixo.

Objetos de valor **com regra de validação própria** (ex.: `Quantidade`, que exige valor > 0) também viram classes imutáveis, com construtor privado e um método estático de criação que valida antes de instanciar. Objetos de valor que são apenas agrupamento de dados sem validação (ex.: `PeriodoValidade`) podem ser `type`/`readonly interface`, sem necessidade de classe.

```typescript
class Quantidade {
  private constructor(readonly valor: number, readonly unidadeMedida: string) {}

  static criar(valor: number, unidadeMedida: string): Quantidade {
    if (valor <= 0) {
      throw new CargaQuimicaError("RN11", "Quantidade deve ser maior que zero.");
    }
    return new Quantidade(valor, unidadeMedida);
  }
}
```

## Enums para status e classificações

Usados para os conjuntos fechados de valores já definidos em [`diagramas/fluxo-status.md`](diagramas/fluxo-status.md) e em `dominio.md`:

```typescript
enum StatusCarga {
  Registrada = "Registrada",
  EmValidacaoDocumental = "EmValidacaoDocumental",
  EmInspecao = "EmInspecao",
  Liberada = "Liberada",
  Bloqueada = "Bloqueada",
  Cancelada = "Cancelada",
}

enum StatusValidacaoDocumento {
  Pendente = "Pendente",
  Valido = "Valido",
  Invalido = "Invalido",
}

enum ResultadoInspecao {
  Pendente = "Pendente",
  Aprovada = "Aprovada",
  Reprovada = "Reprovada",
}
```

Um enum central por conceito de status evita "strings mágicas" espalhadas pelo código e torna as transições do diagrama de fluxo verificáveis pelo compilador.

## Funções puras para validações

As regras de negócio que não dependem de estado externo (ex.: RN11 — quantidade maior que zero) são implementadas como funções puras: mesma entrada sempre produz a mesma saída, sem efeito colateral, fáceis de testar isoladamente (base do plano de testes em [`qualidade.md`](qualidade.md)).

```typescript
function quantidadeEhValida(valor: number): boolean {
  return valor > 0;
}

function produtoPodeSerUsadoEmNovaCarga(produto: ProdutoQuimico): boolean {
  return produto.status === "Ativo";
}
```

Essas funções ficam próximas da entidade/VO que as usa (ex.: dentro do módulo `carga-quimica/`), e são chamadas pelos métodos de fábrica e pelos métodos de transição de estado das classes de domínio — a função pura decide "é válido?", a classe decide "o que fazer com a resposta".

## Módulos ES6+

Organização por módulos com `import`/`export` nomeados (sem `export default`, para manter nomes explícitos nos pontos de uso). Cada pasta de agregado (`domain/carga-quimica/`, `domain/produto-quimico/`, ...) expõe um `index.ts` (barrel) que reexporta só o que deve ser público do módulo — mantendo detalhes internos (como funções auxiliares privadas) fora do alcance de outras camadas.

## async/await em integrações futuras

Todas as interfaces de repositório já são declaradas com assinatura assíncrona (`Promise<T>`), mesmo a implementação em memória desta fase sendo síncrona por natureza — assim, quando um banco de dados real for integrado nas próximas fases, o contrato não muda, só a implementação. Os casos de uso (camada `application`) usam `async/await` para orquestrar chamadas a repositórios, com tratamento de erro via `try/catch` (ver "Tratamento de erros" abaixo) em vez de encadeamento de `.then()`.

## Generics

Usados onde o mesmo comportamento se repete entre casos de uso ou repositórios diferentes:

```typescript
interface IUseCase<TInput, TOutput> {
  executar(input: TInput): Promise<TOutput>;
}

class LiberarCargaQuimica implements IUseCase<LiberarCargaQuimicaInput, LiberarCargaQuimicaOutput> {
  constructor(private readonly repositorio: ICargaQuimicaRepository) {}

  async executar(input: LiberarCargaQuimicaInput): Promise<LiberarCargaQuimicaOutput> {
    const carga = await this.repositorio.buscarPorId(input.cargaId);
    // orquestra o domínio, não reimplementa a regra
    carga.liberar(/* ... */);
    await this.repositorio.salvar(carga);
    return { status: carga.status };
  }
}
```

Um `Result<T, E>` genérico (ver próxima seção) e uma eventual interface base `IRepository<T>` seguem o mesmo raciocínio: evitar repetir a mesma forma para cada agregado.

## Tratamento de erros

Erros de domínio são classes próprias por agregado (`CargaQuimicaError`, `ProdutoQuimicoError`), estendendo uma classe base `DomainError`, sempre carregando o código da regra violada — para rastreabilidade direta com [`regras-de-negocio.md`](regras-de-negocio.md):

```typescript
abstract class DomainError extends Error {
  constructor(readonly regra: string, mensagem: string) {
    super(mensagem);
  }
}

class CargaQuimicaError extends DomainError {}
```

Para os fluxos de validação de negócio **esperados** (ex.: tentativa de liberar carga sem documentação), a preferência é por um tipo `Result<T, E>` em vez de lançar exceção — erro de regra de negócio não é uma falha do sistema, é um resultado possível do caso de uso:

```typescript
type Result<T, E> =
  | { sucesso: true; valor: T }
  | { sucesso: false; erro: E };
```

Exceções (`throw`) ficam reservadas para falhas verdadeiramente excepcionais (infraestrutura indisponível, dado corrompido), não para o fluxo normal de regras de negócio. A escolha final entre usar `Result` de forma consistente em todo o domínio ou exceções de domínio tipadas ainda vai ser validada pelo grupo na implementação, mas a diretriz de não usar exceção para controle de fluxo de negócio já está definida desde já.

## Organização de contratos e tipos compartilhados

- `shared/types/`: tipos usados por mais de uma camada (ex.: `type Id = string`);
- `shared/errors/`: a classe base `DomainError` e utilitários de erro comuns;
- os DTOs de entrada/saída de cada caso de uso ficam dentro da própria pasta do caso de uso (ex.: `application/use-cases/registrar-carga-quimica/RegistrarCargaQuimicaDTO.ts`), não em `shared/` — evita acoplar casos de uso que não têm relação entre si só porque compartilham uma pasta comum.

Essa organização segue a estrutura de pastas já proposta em [`arquitetura.md`](arquitetura.md).