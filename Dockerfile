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

# Usuário não-root já existe na imagem oficial do Node ("node"). Dono do
# WORKDIR trocado antes de copiar/instalar para que tudo já nasça com o
# dono certo, evitando um chown -R caro sobre node_modules inteira.
RUN chown node:node /app
USER node

COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --omit=dev \
  && npm cache clean --force

COPY --chown=node:node --from=build /app/dist ./dist
COPY --chown=node:node --from=build /app/generated ./generated
COPY --chown=node:node --from=build /app/prisma ./prisma
# prisma/seed.ts importa direto de src/ (via tsx) — precisa estar presente
# em runtime para "npm run db:seed" funcionar dentro do container.
COPY --chown=node:node --from=build /app/src ./src
COPY --chown=node:node prisma7.config.ts tsconfig.json ./

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# Aplica migrações pendentes e então inicia o servidor.
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node dist/src/main.js"]
