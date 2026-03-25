FROM oven/bun:1.3.5-alpine AS base

WORKDIR /app

FROM base AS deps
COPY package.json bun.lock* ./
COPY tsconfig.json ./
COPY apps/admin/package.json ./apps/admin/

RUN bun install

FROM deps AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY apps/admin ./apps/admin

RUN bun run --cwd apps/admin build

FROM nginx:alpine AS runner
COPY --from=builder /app/apps/admin/dist /usr/share/nginx/html
COPY apps/admin/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

