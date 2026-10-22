import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import type { Container } from "../../../container.js";
import { CargaQuimicaController } from "../controllers/CargaQuimicaController.js";
import { ErroRespostaSchema, IdParamsSchema } from "../schemas/common.schemas.js";
import {
  AdicionarDocumentoCargaBodySchema,
  AssumirResponsabilidadeTecnicaBodySchema,
  AtualizarStatusCargaBodySchema,
  BloquearCargaQuimicaBodySchema,
  CancelarCargaQuimicaBodySchema,
  CargaQuimicaRespostaSchema,
  DocumentoCargaParamsSchema,
  DocumentoCargaRespostaSchema,
  HistoricoCargaRespostaSchema,
  InspecaoRespostaSchema,
  ListarCargasQuimicasQuerySchema,
  ListarCargasQuimicasRespostaSchema,
  RegistrarCargaQuimicaBodySchema,
  RegistrarInspecaoCargaBodySchema,
  ValidarDocumentoCargaBodySchema,
} from "../schemas/cargas-quimicas.schemas.js";

const TAGS = ["Cargas Químicas"];

export async function registrarRotasCargasQuimicas(
  app: FastifyInstance,
  container: Container,
): Promise<void> {
  const rotas = app.withTypeProvider<ZodTypeProvider>();

  rotas.post(
    "/cargas-quimicas",
    {
      schema: {
        summary: "Registra uma nova carga química (UC03)",
        description: "Aplica RN01-RN03, RN11, RN12. Status inicial: Registrada.",
        tags: TAGS,
        body: RegistrarCargaQuimicaBodySchema,
        response: {
          201: CargaQuimicaRespostaSchema,
          400: ErroRespostaSchema,
          404: ErroRespostaSchema,
          409: ErroRespostaSchema,
          422: ErroRespostaSchema,
        },
      },
    },
    async (request, reply) => {
      const carga = await CargaQuimicaController.registrar(container, request.body);
      reply.status(201).send(carga);
    },
  );

  rotas.get(
    "/cargas-quimicas",
    {
      schema: {
        summary: "Consulta cargas por status (UC10)",
        tags: TAGS,
        querystring: ListarCargasQuimicasQuerySchema,
        response: { 200: ListarCargasQuimicasRespostaSchema, 400: ErroRespostaSchema },
      },
    },
    async (request) => CargaQuimicaController.listar(container, request.query),
  );

  rotas.get(
    "/cargas-quimicas/:id",
    {
      schema: {
        summary: "Busca uma carga química pelo id (inclui documentos e inspeções)",
        tags: TAGS,
        params: IdParamsSchema,
        response: { 200: CargaQuimicaRespostaSchema, 404: ErroRespostaSchema },
      },
    },
    async (request) => CargaQuimicaController.buscarPorId(container, request.params.id),
  );

  rotas.patch(
    "/cargas-quimicas/:id/status",
    {
      schema: {
        summary: "Atualiza o status da carga (UC08)",
        description:
          "Único ponto genérico de transição — usa a mesma tabela de 11 transições (RN14) dos endpoints dedicados. `motivo` obrigatório para Bloqueada/Cancelada.",
        tags: TAGS,
        params: IdParamsSchema,
        body: AtualizarStatusCargaBodySchema,
        response: {
          200: CargaQuimicaRespostaSchema,
          400: ErroRespostaSchema,
          404: ErroRespostaSchema,
          409: ErroRespostaSchema,
          422: ErroRespostaSchema,
        },
      },
    },
    async (request) =>
      CargaQuimicaController.atualizarStatus(
        container,
        request.params.id,
        request.body.status,
        request.body.motivo,
      ),
  );

  rotas.patch(
    "/cargas-quimicas/:id/bloquear",
    {
      schema: {
        summary: "Bloqueia a carga química (UC07)",
        description: "RN05, RN14 — só é permitido a partir de EmInspecao.",
        tags: TAGS,
        params: IdParamsSchema,
        body: BloquearCargaQuimicaBodySchema,
        response: { 200: CargaQuimicaRespostaSchema, 400: ErroRespostaSchema, 404: ErroRespostaSchema, 409: ErroRespostaSchema },
      },
    },
    async (request) =>
      CargaQuimicaController.bloquear(container, request.params.id, request.body.motivo),
  );

  rotas.patch(
    "/cargas-quimicas/:id/liberar",
    {
      schema: {
        summary: "Libera a carga química para movimentação (UC06)",
        description: "RN04, RN06, RN07, RN12, RN13 — todas verificadas antes da liberação.",
        tags: TAGS,
        params: IdParamsSchema,
        response: {
          200: CargaQuimicaRespostaSchema,
          404: ErroRespostaSchema,
          409: ErroRespostaSchema,
          422: ErroRespostaSchema,
        },
      },
    },
    async (request) => CargaQuimicaController.liberar(container, request.params.id),
  );

  rotas.patch(
    "/cargas-quimicas/:id/cancelar",
    {
      schema: {
        summary: "Cancela a carga química (UC09)",
        description: "RN06, RN15 — permitido a partir de Registrada, EmAnalise, EmInspecao, Liberada ou Bloqueada.",
        tags: TAGS,
        params: IdParamsSchema,
        body: CancelarCargaQuimicaBodySchema,
        response: { 200: CargaQuimicaRespostaSchema, 400: ErroRespostaSchema, 404: ErroRespostaSchema, 409: ErroRespostaSchema },
      },
    },
    async (request) =>
      CargaQuimicaController.cancelar(container, request.params.id, request.body.motivo),
  );

  rotas.post(
    "/cargas-quimicas/:id/documentos",
    {
      schema: {
        summary: "Anexa um documento obrigatório à carga (UC04)",
        tags: TAGS,
        params: IdParamsSchema,
        body: AdicionarDocumentoCargaBodySchema,
        response: {
          201: DocumentoCargaRespostaSchema,
          400: ErroRespostaSchema,
          404: ErroRespostaSchema,
          409: ErroRespostaSchema,
        },
      },
    },
    async (request, reply) => {
      const documento = await CargaQuimicaController.adicionarDocumento(
        container,
        request.params.id,
        request.body,
      );
      reply.status(201).send(documento);
    },
  );

  rotas.patch(
    "/cargas-quimicas/:id/documentos/:documentoId/validacao",
    {
      schema: {
        summary: "Valida/invalida um documento da carga (UC04)",
        tags: TAGS,
        params: DocumentoCargaParamsSchema,
        body: ValidarDocumentoCargaBodySchema,
        response: {
          200: DocumentoCargaRespostaSchema,
          400: ErroRespostaSchema,
          404: ErroRespostaSchema,
          409: ErroRespostaSchema,
        },
      },
    },
    async (request) =>
      CargaQuimicaController.validarDocumento(
        container,
        request.params.id,
        request.params.documentoId,
        request.body.status,
      ),
  );

  rotas.post(
    "/cargas-quimicas/:id/inspecoes",
    {
      schema: {
        summary: "Registra uma inspeção (UC05)",
        description: "Resultado Reprovada aciona bloqueio automático (RN07).",
        tags: TAGS,
        params: IdParamsSchema,
        body: RegistrarInspecaoCargaBodySchema,
        response: {
          201: InspecaoRespostaSchema,
          400: ErroRespostaSchema,
          404: ErroRespostaSchema,
          409: ErroRespostaSchema,
        },
      },
    },
    async (request, reply) => {
      const inspecao = await CargaQuimicaController.registrarInspecao(
        container,
        request.params.id,
        request.body,
      );
      reply.status(201).send(inspecao);
    },
  );

  rotas.patch(
    "/cargas-quimicas/:id/aceite-responsavel-tecnico",
    {
      schema: {
        summary: "Registra o aceite formal do responsável técnico (UC12)",
        description: "RN13 — pré-requisito de liberação. 422 se o RT não for o vinculado; 409 se já registrado.",
        tags: TAGS,
        params: IdParamsSchema,
        body: AssumirResponsabilidadeTecnicaBodySchema,
        response: {
          200: CargaQuimicaRespostaSchema,
          400: ErroRespostaSchema,
          404: ErroRespostaSchema,
          409: ErroRespostaSchema,
          422: ErroRespostaSchema,
        },
      },
    },
    async (request) =>
      CargaQuimicaController.assumirResponsabilidadeTecnica(
        container,
        request.params.id,
        request.body.responsavelTecnicoId,
      ),
  );

  rotas.get(
    "/cargas-quimicas/:id/historico",
    {
      schema: {
        summary: "Consulta o histórico de status da carga (UC11)",
        tags: TAGS,
        params: IdParamsSchema,
        response: { 200: HistoricoCargaRespostaSchema, 404: ErroRespostaSchema },
      },
    },
    async (request) => CargaQuimicaController.obterHistorico(container, request.params.id),
  );
}
