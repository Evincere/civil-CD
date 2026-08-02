# ── Stage 1: Build con Vite ──────────────────────────────────────────
FROM public.ecr.aws/docker/library/node:22-alpine AS builder
WORKDIR /app

# Copiar manifiestos primero (aprovecha layer cache de Docker)
COPY package*.json ./
RUN npm ci --prefer-offline

# Copiar el resto del código y construir
COPY . .
RUN npm run build

# ── Stage 2: Serve con Nginx + Node Backend ──────────────────────────
FROM public.ecr.aws/nginx/nginx:alpine
RUN apk add --no-cache nodejs npm

WORKDIR /app
COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /app/backend /app/backend
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Instalar dependencias de producción del backend
RUN cd /app/backend && npm install --omit=dev

# Script de arranque para ejecutar Node backend en segundo plano y Nginx en primer plano
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'cd /app/backend && node server.js &' >> /start.sh && \
    echo 'nginx -g "daemon off;"' >> /start.sh && \
    chmod +x /start.sh

EXPOSE 80
CMD ["/start.sh"]
