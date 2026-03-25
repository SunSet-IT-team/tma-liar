FROM oven/bun:1.3.5-alpine AS base

# Установка зависимостей
FROM base AS deps
WORKDIR /app

COPY package.json bun.lock* ./
COPY tsconfig.json ./
COPY apps/backend/package.json ./apps/backend/

# Копируем packages/shared для workspaces
COPY packages/shared ./packages/shared
COPY packages/message-types ./packages/message-types

RUN bun install

# Сборка приложения
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

COPY package.json ./
COPY tsconfig.json ./
COPY apps/backend ./apps/backend
COPY packages/shared ./packages/shared
COPY packages/message-types ./packages/message-types

# Production образ
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Создаем непривилегированного пользователя
RUN addgroup --system --gid 1001 bunuser && \
    adduser --system --uid 1001 bunuser

# Копируем зависимости и приложение
COPY --from=deps --chown=bunuser:bunuser /app/node_modules ./node_modules
COPY --from=builder --chown=bunuser:bunuser /app/apps/backend ./apps/backend
COPY --from=builder --chown=bunuser:bunuser /app/packages/shared ./packages/shared
COPY --from=builder --chown=bunuser:bunuser /app/packages/message-types ./packages/message-types
COPY --from=builder --chown=bunuser:bunuser /app/package.json ./
COPY --from=builder --chown=bunuser:bunuser /app/tsconfig.json ./

USER bunuser

EXPOSE 3000

ENV PORT=3000

# Запуск приложения через Bun
WORKDIR /app/apps/backend
CMD ["bun", "src/index.ts"]
