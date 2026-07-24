# ==============================================================================
# Frontend Dockerfile for Hostel Management System
# Multi-stage build: Node.js 20 Builder stage -> Nginx Alpine Production Server
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build React/Vite SPA
# ------------------------------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package definitions
COPY package*.json ./

# Install all dependencies (including devDependencies for Vite)
RUN npm ci

# Copy source files
COPY . .

# Build Vite static bundle
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Serve with Lightweight Nginx Alpine
# ------------------------------------------------------------------------------
FROM nginx:alpine AS runner

# Install wget/curl for health checks
RUN apk add --no-cache curl

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
