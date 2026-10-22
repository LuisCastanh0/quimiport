import type { FastifyInstance } from "fastify";

/**
 * Log de requisição (§9): id, método, url, status, duração. O pino já
 * registra isso via `app.log` (configurado em `server.ts`); aqui
 * garantimos que o `x-request-id` enviado pelo cliente é respeitado e
 * que cabeçalhos sensíveis nunca aparecem no log.
 */
export function registrarRequestLogging(app: FastifyInstance): void {
  app.addHook("onRequest", (request, _reply, done) => {
    request.log.info(
      { method: request.method, url: request.url, requestId: request.id },
      "requisicao.recebida",
    );
    done();
  });

  app.addHook("onResponse", (request, reply, done) => {
    request.log.info(
      {
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        responseTime: reply.elapsedTime,
        requestId: request.id,
      },
      "requisicao.concluida",
    );
    done();
  });
}
