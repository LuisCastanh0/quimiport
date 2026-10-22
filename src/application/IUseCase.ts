/** Generic — cada caso de uso implementa um único método `executar`. */
export interface IUseCase<TInput, TOutput> {
  executar(input: TInput): Promise<TOutput>;
}
