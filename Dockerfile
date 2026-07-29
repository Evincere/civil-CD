# ── Stage 1: Build con Vite ──────────────────────────────────────────
FROM public.ecr.aws/docker/library/node:22-alpine AS builder
WORKDIR /app

# Copiar manifiestos primero (aprovecha layer cache de Docker)
COPY package*.json ./
RUN npm ci --prefer-offline

# Copiar el resto del código y construir
COPY . .
RUN npm run build

# ── Stage 2: Serve con Nginx ──────────────────────────────────────────
FROM public.ecr.aws/nginx/nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
