# syntax=docker/dockerfile:1

# ─────────────────────────────────────────────────────────────
# Dependencias de desarrollo (se usan para compilar y migrar)
# ─────────────────────────────────────────────────────────────
FROM node:24-bookworm AS deps

WORKDIR /app

# Evita que @prisma/client intente generar durante npm ci.
# La generación se hace explícitamente en la etapa build.
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true

COPY package.json package-lock.json ./
RUN npm ci

# ─────────────────────────────────────────────────────────────
# Build: genera el cliente Prisma y compila TypeScript
# ─────────────────────────────────────────────────────────────
FROM deps AS build

COPY prisma.config.ts tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

# Prisma necesita que DATABASE_URL exista para evaluar prisma.config.ts,
# pero generate no se conecta a la base. El valor real lo pone Compose.
ARG DATABASE_URL=postgresql://build:build@localhost:5432/build
RUN DATABASE_URL="$DATABASE_URL" node node_modules/prisma/build/index.js generate

RUN npm run build

# ─────────────────────────────────────────────────────────────
# Migraciones: imagen one-shot con el CLI de Prisma
# ─────────────────────────────────────────────────────────────
FROM build AS migrate

CMD ["node", "node_modules/prisma/build/index.js", "migrate", "deploy"]

# ─────────────────────────────────────────────────────────────
# Dependencias de producción
# ─────────────────────────────────────────────────────────────
FROM node:24-bookworm AS prod-deps

WORKDIR /app

ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ─────────────────────────────────────────────────────────────
# Imagen final: sólo lo necesario para ejecutar la API
# ─────────────────────────────────────────────────────────────
FROM node:24-bookworm-slim AS runtime

ENV PORT=3000

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl tzdata \
  && rm -rf /var/lib/apt/lists/*

COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/dist ./dist

RUN mkdir -p /app/uploads && chown node:node /app/uploads

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || '3000') + '/api/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "dist/server.js"]
