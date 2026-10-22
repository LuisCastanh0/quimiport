import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import type { Container } from "../../../container.js";
import { ProdutoQuimicoController } from "../controllers/ProdutoQuimicoController.js";
import { ErroRespostaSchema, IdParamsSchema } from "../schemas/common.schemas.js";
import {
  AtualizarProdutoQuimicoBodySchema,
  CadastrarProdutoQuimicoBodySchema,
  ListarProdutosQuimicosQuerySchema,
  ListarProdutosQuimicosRespostaSchema,
  ProdutoQuimicoRespostaSchema,
} from "../schemas/produtos-quimicos.schemas.js";

const TAGS = ["Produtos Químicos"];

export async function registrarRotasProdutosQuimicos(
  app: FastifyInstance,
  container: Container,
): Promise<void> {
  const rotas = app.withTypeProvider<ZodTypeProvider>();

  rotas.post(
    "/produtos-quimicos",
    {
      schema: {
        summary: "Cadastra um novo produto químico (UC01)",
        description: "Aplica RN08 (nome obrigatório) e RN09 (classe de risco obrigatória).",
        tags: TAGS,
        body: CadastrarProdutoQuimicoBodySchema,
        response: {
          201: ProdutoQuimicoRespostaSchema,
          400: ErroRespostaSchema,
          409: ErroRespostaSchema,
        },
      },
    },
    async (request, reply) => {
      const produto = await ProdutoQuimicoController.cadastrar(container, request.body);
      reply.status(201).send(produto);
    },
  );

  rotas.get(
    "/produtos-quimicos",
    {
      schema: {
        summary: "Lista produtos químicos",
        tags: TAGS,
        querystring: ListarProdutosQuimicosQuerySchema,
        response: { 200: ListarProdutosQuimicosRespostaSchema },
      },
    },
    async (request) => ProdutoQuimicoController.listar(container, request.query),
  );

  rotas.get(
    "/produtos-quimicos/:id",
    {
      schema: {
        summary: "Busca um produto químico pelo id",
        tags: TAGS,
        params: IdParamsSchema,
        response: { 200: ProdutoQuimicoRespostaSchema, 404: ErroRespostaSchema },
      },
    },
    async (request) => ProdutoQuimicoController.buscarPorId(container, request.params.id),
  );

  rotas.put(
    "/produtos-quimicos/:id",
    {
      schema: {
        summary: "Atualiza os dados de um produto químico (não altera status)",
        tags: TAGS,
        params: IdParamsSchema,
        body: AtualizarProdutoQuimicoBodySchema,
        response: { 200: ProdutoQuimicoRespostaSchema, 400: ErroRespostaSchema, 404: ErroRespostaSchema, 409: ErroRespostaSchema },
      },
    },
    async (request) =>
      ProdutoQuimicoController.atualizar(container, request.params.id, request.body),
  );

  rotas.patch(
    "/produtos-quimicos/:id/inativar",
    {
      schema: {
        summary: "Inativa um produto químico (UC02)",
        description: "RN10 — produto inativo não pode originar novas cargas; 409 se já estiver inativo.",
        tags: TAGS,
        params: IdParamsSchema,
        response: { 200: ProdutoQuimicoRespostaSchema, 404: ErroRespostaSchema, 409: ErroRespostaSchema },
      },
    },
    async (request) => ProdutoQuimicoController.inativar(container, request.params.id),
  );
}
