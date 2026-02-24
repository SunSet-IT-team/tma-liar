FROM oven/bun:1.3.5-alpine AS base

FROM base AS deps
WORKDIR /app

COPY package.json bun.lock* ./
COPY tsconfig.json ./
COPY apps/frontend/package.json ./apps/frontend/

# Копируем packages/shared для workspaces
COPY packages/shared ./packages/shared

RUN bun install

FROM base AS builder
WORKDIR /app

COPY package.json ./
COPY tsconfig.json ./
COPY apps/frontend/tsconfig*.json ./apps/frontend/
# Копируем исходный код frontend
COPY apps/frontend ./apps/frontend
COPY packages/shared ./packages/shared

# Копируем зависимости из deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/frontend/node_modules ./apps/frontend/node_modules

WORKDIR /app/apps/frontend

RUN bun run build

# Production образ с Nginx
FROM nginx:alpine AS runner

# Копируем собранное приложение
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

# Копируем конфигурацию Nginx
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
