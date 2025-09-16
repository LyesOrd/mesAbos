# Build simple et robuste pour Angular 19+
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Debug - voir la structure générée
RUN echo "=== Structure de dist/ ===" && \
    find dist/ -type f | head -10 || echo "Erreur: pas de dist/"

# Production
FROM nginx:alpine
# Copier avec fallback pour différentes structures Angular
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/dist/ /tmp/dist/
RUN if [ -d "/tmp/dist/front/browser" ]; then \
      cp -r /tmp/dist/front/browser/* /usr/share/nginx/html/; \
    elif [ -d "/tmp/dist/front" ]; then \
      cp -r /tmp/dist/front/* /usr/share/nginx/html/; \
    else \
      cp -r /tmp/dist/* /usr/share/nginx/html/; \
    fi && \
    rm -rf /tmp/dist

COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 4200
CMD ["nginx", "-g", "daemon off;"]
