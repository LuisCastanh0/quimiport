import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default("0.0.0.0"),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL é obrigatória"),
  DATABASE_URL_TEST: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Valida as variáveis de ambiente usando Zod. Lançar aqui (em vez de deixar
 * o processo seguir com `undefined`) é intencional: preferimos falhar
 * rápido, na borda de infraestrutura, do que deixar o domínio lidar com
 * configuração ausente.
 */
export function carregarEnv(fonte: NodeJS.ProcessEnv = process.env): Env {
  const resultado = envSchema.safeParse(fonte);
  if (!resultado.success) {
    const detalhes = resultado.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Configuração de ambiente inválida: ${detalhes}`);
  }
  return resultado.data;
}
