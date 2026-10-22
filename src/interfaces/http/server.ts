import Fastify, { type FastifyInstance, type FastifyBaseLogger } from "fastify";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import type { Container } from "../../container.js";
import { registrarErrorHandler } from "./plugins/error-handler.js";
import { registrarRequestLogging } from "./plugins/request-logging.js";
import { registrarSwagger } from "./plugins/swagger.js";
import { registrarRotasCargasQuimicas } from "./routes/cargas-quimicas.routes.js";
import { registrarRotasHealth } from "./routes/health.routes.js";
import { registrarRotasProdutosQuimicos } from "./routes/produtos-quimicos.routes.js";
import { registrarRotasResponsaveisTecnicos } from "./routes/responsaveis-tecnicos.routes.js";

export interface BuildServerOptions {
  /** Logger pino já construído (produção); se omitido, logs ficam silenciosos (testes). */
  readonly loggerInstance?: FastifyBaseLogger;
}

/**
 * `buildServer(container)` — ponto único de montagem da API, usado tanto
 * por `main.ts` quanto pelos testes de integração HTTP (Supertest/`inject`
 * sobre a mesma instância, sem subir uma porta de rede real).
 */
export async function buildServer(
  container: Container,
  options: BuildServerOptions = {},
): Promise<FastifyInstance> {
  const app = Fastify({
    logger: options.loggerInstance ? undefined : false,
    loggerInstance: options.loggerInstance,
    genReqId: (request) => (request.headers["x-request-id"] as string | undefined) ?? crypto.randomUUID(),
    disableRequestLogging: true,
  });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  registrarRequestLogging(app);
  registrarErrorHandler(app, container.logger);

  await registrarSwagger(app);

  await registrarRotasHealth(app, container);
  await registrarRotasProdutosQuimicos(app, container);
  await registrarRotasResponsaveisTecnicos(app, container);
  await registrarRotasCargasQuimicas(app, container);

  return app;
}
