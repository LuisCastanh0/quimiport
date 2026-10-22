# QuimiPort — Fase 2 — imagem multi-estágio (deps -> build -> runtime)
# node:24-slim (Debian) evitado o atrito histórico de alpine+OpenSSL com o
# engine do Prisma — ver §10 das instruções da Fase 2.

ARG NODE_VERSION=24

# ---- deps: instala todas as dependências (inclui dev, usadas no build) ----
FROM node:${NODE_VERSION}-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- build: gera o client Prisma e compila TypeScript -> dist/ ----
FROM node:${NODE_VERSION}-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json prisma7.config.ts tsconfig.json tsconfig.build.json ./
COPY prisma ./prisma
COPY src ./src
RUN npx prisma generate
RUN npm run build

# ---- runtime: apenas dependências de produção + artefatos compilados ----
FROM node:${NODE_VERSION}-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev \
  && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY --from=build /app/generated ./generated
COPY --from=build /app/prisma ./prisma
COPY prisma7.config.ts ./

# Usuário não-root já existe na imagem oficial do Node ("node").
RUN chown -R node:node /app
USER node

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# Aplica migrações pendentes e então inicia o servidor.
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node dist/src/main.js"]
