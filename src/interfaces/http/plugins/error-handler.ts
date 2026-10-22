import type { FastifyError, FastifyInstance } from "fastify";
import { hasZodFastifySchemaValidationErrors } from "fastify-type-provider-zod";
import type { ILogger } from "../../../application/ports/ILogger.js";
import { DomainError, type TipoErroDominio } from "../../../shared/errors/DomainError.js";

const STATUS_POR_TIPO: Record<TipoErroDominio, number> = {
  validacao: 400,
  naoEncontrado: 404,
  conflito: 409,
  regra: 422,
};

/**
 * Único ponto de mapeamento `DomainError -> HTTP` (§7.3 das instruções da
 * Fase 2). Nenhuma rota/controller decide status code sozinha.
 */
export function registrarErrorHandler(app: FastifyInstance, logger: ILogger): void {
  app.setErrorHandler((error: FastifyError | (Error & { statusCode?: number }), request, reply) => {
    const requestId = request.id;

    if (error instanceof DomainError) {
      const nivel = error.tipo === "naoEncontrado" ? "info" : "warn";
      logger[nivel]("erro.tratado", {
        codigo: error.codigo,
        regra: error.regra,
        tipo: error.tipo,
        requestId,
      });
      reply.status(STATUS_POR_TIPO[error.tipo]).send({
        codigo: error.codigo,
        mensagem: error.message,
        regra: error.regra,
        detalhes: error.detalhes,
        requestId,
      });
      return;
    }

    if (hasZodFastifySchemaValidationErrors(error)) {
      const detalhes = error.validation.map((item) => ({
        campo:
          (item.instancePath ?? "").replace(/^\//, "").replace(/\//g, ".") ||
          (typeof item.params?.["issue"] === "object" ? "" : String(item.params?.["missingProperty"] ?? "")),
        mensagem: item.message ?? "Campo inválido.",
      }));
      logger.warn("erro.validacao", { detalhes, requestId });
      reply.status(400).send({
        codigo: "VALIDACAO",
        mensagem: "Erro de validação dos dados enviados.",
        detalhes,
        requestId,
      });
      return;
    }

    const statusCode = "statusCode" in error ? (error.statusCode as number | undefined) : undefined;
    if (statusCode && statusCode >= 400 && statusCode < 500) {
      logger.warn("erro.requisicao", { mensagem: error.message, statusCode, requestId });
      reply.status(statusCode).send({
        codigo: "VALIDACAO",
        mensagem: error.message,
        detalhes: [],
        requestId,
      });
      return;
    }

    // Erro verdadeiramente inesperado — nunca expõe stack/detalhe interno no corpo.
    logger.error("erro.interno", { mensagem: error.message, stack: error.stack, requestId });
    reply.status(500).send({
      codigo: "ERRO_INTERNO",
      mensagem: "Erro interno do servidor.",
      detalhes: [],
      requestId,
    });
  });
}
