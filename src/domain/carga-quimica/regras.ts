import { DocumentoCarga, TIPOS_DOCUMENTO } from "./DocumentoCarga.js";
import { Inspecao, ResultadoInspecao } from "./Inspecao.js";

/**
 * RN17 — a documentação obrigatória é um documento de cada tipo, válido
 * (`Valido`) e não vencido na data de referência. Função pura: mesma
 * entrada, mesma saída, sem efeito colateral.
 */
export function documentacaoObrigatoriaValida(
  documentos: ReadonlyArray<DocumentoCarga>,
  referencia: Date,
): boolean {
  return TIPOS_DOCUMENTO.every((tipo) => {
    const documento = documentos.find((d) => d.tipo === tipo);
    return documento !== undefined && documento.estaValidoEm(referencia);
  });
}

/**
 * RN07 — liberação exige que a inspeção mais recente (pela `dataInspecao`)
 * tenha resultado `Aprovada`.
 */
export function inspecaoMaisRecenteAprovada(inspecoes: ReadonlyArray<Inspecao>): boolean {
  if (inspecoes.length === 0) {
    return false;
  }
  const maisRecente = [...inspecoes].sort(
    (a, b) => b.dataInspecao.getTime() - a.dataInspecao.getTime(),
  )[0];
  return maisRecente?.resultado === ResultadoInspecao.Aprovada;
}
