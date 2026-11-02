import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import type { Container } from "../../../container.js";

export async function registrarRotasHealth(app: FastifyInstance, container: Container): Promise<void> {
  app.withTypeProvider<ZodTypeProvider>().get(
    "/health",
    {
      schema: {
        summary: "Verifica a saúde da API (liveness) e a conectividade com o banco",
        tags: ["Operações"],
        response: {
          200: z
            .object({
              status: z.literal("ok"),
              bancoDeDados: z.enum(["conectado", "indisponivel"]),
              timestamp: z.string(),
            })
            .meta({
              example: {
                status: "ok",
                bancoDeDados: "conectado",
                timestamp: "2026-01-01T12:00:00.000Z",
              },
            }),
          503: z
            .object({
              status: z.literal("degradado"),
              bancoDeDados: z.literal("indisponivel"),
              timestamp: z.string(),
            })
            .meta({
              example: {
                status: "degradado",
                bancoDeDados: "indisponivel",
                timestamp: "2026-01-01T12:00:00.000Z",
              },
            }),
        },
      },
    },
    async (_request, reply) => {
      const bancoOk = await container.pingBancoDados();
      const timestamp = new Date().toISOString();
      if (bancoOk) {
        reply.status(200).send({ status: "ok" as const, bancoDeDados: "conectado" as const, timestamp });
      } else {
        reply
          .status(503)
          .send({ status: "degradado" as const, bancoDeDados: "indisponivel" as const, timestamp });
      }
    },
  );
}
