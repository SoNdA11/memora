FROM node:20-alpine AS builder

ARG VITE_API_URL=''
ENV VITE_API_URL=$VITE_API_URL

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Ajusta ownership para um futuro USER nginx; valida a config no build.
RUN chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx /var/log/nginx 2>/dev/null || true \
    && nginx -t

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=10s \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Mantido root: nginx escuta :80 (porta privilegiada, exige root/CAP_NET_BIND_SERVICE).
# Para rodar como `USER nginx`, trocar `listen 80` por `listen 8080` e expor 8080,
# além de `chown nginx:nginx /var/run /etc/nginx/conf.d`.
CMD ["nginx", "-g", "daemon off;"]
