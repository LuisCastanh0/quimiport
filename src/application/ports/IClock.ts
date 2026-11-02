/**
 * Porta de relógio — injetada em tudo que depende do "agora" (ver §5.3 das
 * instruções da Fase 2), para manter os casos de uso determinísticos em
 * teste (`FakeClock`) e usar o relógio real em produção (`SystemClock`).
 */
export interface IClock {
  agora(): Date;
}
