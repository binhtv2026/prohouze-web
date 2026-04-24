FROM node:20-alpine AS builder

WORKDIR /app

# Cài deps
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# Build production
COPY . .
ARG REACT_APP_BACKEND_URL=https://api.prohouzing.com
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL
ENV NODE_OPTIONS=--max-old-space-size=4096
RUN npm run build

# ─── Serve với Nginx ───────────────────────────────────────
FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx-frontend.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
