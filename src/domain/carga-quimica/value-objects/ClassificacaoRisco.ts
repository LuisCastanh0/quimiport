import { DomainError } from "../../../shared/errors/DomainError.js";

/** Classes principais de risco da ONU para produtos/cargas perigosas. */
export type ClasseRiscoOnu = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";

const ROTULOS_CATEGORIA_PERIGO: Record<ClasseRiscoOnu, string> = {
  "1": "Explosivos",
  "2": "Gases",
  "3": "Líquidos inflamáveis",
  "4": "Sólidos inflamáveis",
  "5": "Substâncias oxidantes e peróxidos orgânicos",
  "6": "Substâncias tóxicas e infectantes",
  "7": "Material radioativo",
  "8": "Substâncias corrosivas",
  "9": "Substâncias e artigos perigosos diversos",
};

export const CLASSES_RISCO_ONU: ReadonlyArray<ClasseRiscoOnu> = Object.keys(
  ROTULOS_CATEGORIA_PERIGO,
) as ClasseRiscoOnu[];

export class ClassificacaoRiscoError extends DomainError {
  private constructor(mensagem: string, campo: string) {
    super({
      regra: "RN03",
      tipo: "validacao",
      codigo: "VALIDACAO",
      mensagem,
      detalhes: [{ campo, mensagem }],
    });
  }

  static invalida(mensagem: string, campo: string): ClassificacaoRiscoError {
    return new ClassificacaoRiscoError(mensagem, campo);
  }
}

/**
 * Objeto de valor imutável. RN03/RN09 — produto e carga precisam de uma
 * classificação de risco válida. `categoriaPerigo` é derivada da classe
 * (Fase 2 — ver ADR-13), não é mais um campo informado separadamente.
 */
export class ClassificacaoRisco {
  private constructor(readonly classeRisco: ClasseRiscoOnu) {}

  static criar(classeRisco: string, campo = "classificacaoRisco.classeRisco"): ClassificacaoRisco {
    if (!CLASSES_RISCO_ONU.includes(classeRisco as ClasseRiscoOnu)) {
      throw ClassificacaoRiscoError.invalida(
        `Classe de risco "${classeRisco}" inválida; use um valor entre 1 e 9.`,
        campo,
      );
    }
    return new ClassificacaoRisco(classeRisco as ClasseRiscoOnu);
  }

  get categoriaPerigo(): string {
    return ROTULOS_CATEGORIA_PERIGO[this.classeRisco];
  }

  igual(outra: ClassificacaoRisco): boolean {
    return this.classeRisco === outra.classeRisco;
  }
}
