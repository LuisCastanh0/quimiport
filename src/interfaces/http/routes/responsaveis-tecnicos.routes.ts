import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import type { Container } from "../../../container.js";
import { ResponsavelTecnicoController } from "../controllers/ResponsavelTecnicoController.js";
import { ErroRespostaSchema, IdParamsSchema } from "../schemas/common.schemas.js";
import {
  CadastrarResponsavelTecnicoBodySchema,
  ListarResponsaveisTecnicosRespostaSchema,
  ResponsavelTecnicoRespostaSchema,
} from "../schemas/responsaveis-tecnicos.schemas.js";

const TAGS = ["Responsáveis Técnicos"];

export async function registrarRotasResponsaveisTecnicos(
  app: FastifyInstance,
  container: Container,
): Promise<void> {
  const rotas = app.withTypeProvider<ZodTypeProvider>();

  rotas.post(
    "/responsaveis-tecnicos",
    {
      schema: {
        summary: "Cadastra um responsável técnico",
        description: "Suporte a RN12 (toda carga precisa de um RT vinculado).",
        tags: TAGS,
        body: CadastrarResponsavelTecnicoBodySchema,
        response: { 201: ResponsavelTecnicoRespostaSchema, 400: ErroRespostaSchema },
      },
    },
    async (request, reply) => {
      const rt = await ResponsavelTecnicoController.cadastrar(container, request.body);
      reply.status(201).send(rt);
    },
  );

  rotas.get(
    "/responsaveis-tecnicos",
    {
      schema: {
        summary: "Lista responsáveis técnicos",
        tags: TAGS,
        response: { 200: ListarResponsaveisTecnicosRespostaSchema },
      },
    },
    async () => ResponsavelTecnicoController.listar(container),
  );

  rotas.get(
    "/responsaveis-tecnicos/:id",
    {
      schema: {
        summary: "Busca um responsável técnico pelo id",
        tags: TAGS,
        params: IdParamsSchema,
        response: { 200: ResponsavelTecnicoRespostaSchema, 404: ErroRespostaSchema },
      },
    },
    async (request) => ResponsavelTecnicoController.buscarPorId(container, request.params.id),
  );
}
