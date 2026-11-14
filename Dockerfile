# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Frontend React + Vite — build estático servido por nginx
# pronto para PaaS (Render/Railway/Fly)
#
# VITE_API_URL é embutida no bundle em tempo de build:
#   docker build --build-arg VITE_API_URL=https://api.seudominio.com/api/v1 \
#     -t fsppp-frontend ./fsppp-frontend
#
# Run:
#   docker run --rm -p 8080:8080 fsppp-frontend
# ---------------------------------------------------------------------------

FROM node:22-alpine AS build

WORKDIR /app

# Dependências primeiro para aproveitar cache de camadas
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# URL pública da API — precisa existir em build time (Vite)
ARG VITE_API_URL=http://localhost:8080/api/v1
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

FROM nginx:1.27-alpine

# O PaaS injeta PORT (default 8080 para Fly.io/local); nginx usa template
# com envsubst e escuta em ${PORT}
ENV PORT=8080

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q -O /dev/null "http://127.0.0.1:${PORT}/" || exit 1
