import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import type { FastifyInstance } from "fastify";
import { jsonSchemaTransform } from "fastify-type-provider-zod";

export async function registrarSwagger(app: FastifyInstance): Promise<void> {
  await app.register(fastifySwagger, {
    openapi: {
      openapi: "3.0.3",
      info: {
        title: "QuimiPort — API",
        description:
          "API de controle de cargas químicas no Porto de Santos (Fase 2 do Tech Challenge Pós Tech Full Stack Development).",
        version: "2.0.0",
      },
      tags: [
        { name: "Produtos Químicos", description: "Cadastro e inativação de produtos químicos (UC01/UC02)." },
        { name: "Responsáveis Técnicos", description: "Suporte a RN12/RN13." },
        { name: "Cargas Químicas", description: "Ciclo de vida completo da carga química (UC03-UC12)." },
        { name: "Operações", description: "Endpoints de operação/observabilidade." },
      ],
    },
    transform: jsonSchemaTransform,
  });

  await app.register(fastifySwaggerUi, {
    routePrefix: "/docs",
  });
}
