/** Porta de geração de identificadores (UUID em produção). */
export interface IIdGenerator {
  gerar(): string;
}
