# Multi-stage Dockerfile for building the Vite + React app and serving with nginx
# Uses pnpm (version from .mise.toml) to respect the lockfile

FROM node:22-bullseye-slim AS builder
WORKDIR /app

# Ensure corepack / pnpm is available and activate the version pinned in .mise.toml
RUN corepack enable && corepack prepare pnpm@10.34.3 --activate

# Copy package manifests first to leverage layer caching
COPY package.json pnpm-lock.yaml ./

# Install dependencies according to the lockfile
RUN pnpm install --frozen-lockfile

# Copy the rest of the sources
COPY . .

# Build-time args to allow injecting Vite env variables at build time
ARG VITE_API_URL
ARG VITE_USE_MOCK
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_USE_MOCK=${VITE_USE_MOCK}

# Build the production assets (Vite outputs to /app/dist)
RUN pnpm build

FROM nginx:1.25-alpine AS runner

# Copy built static files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Replace default nginx config with one that supports SPA client-side routing
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
