# ==============================================================================
# Backend Dockerfile for Hostel Management System
# Multi-stage production build using Node.js 20 Alpine for security and minimal size.
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Dependency Installation
# ------------------------------------------------------------------------------
FROM node:20-alpine AS deps
WORKDIR /app

# Install build dependencies if native modules are required
RUN apk add --no-linux-headers --no-cache python3 make g++

# Copy package definition files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# ------------------------------------------------------------------------------
# Stage 2: Production Runtime
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy production node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./

# Copy backend source code
COPY . .

# Set non-root user permissions
RUN chown -R node:node /app

# Switch to non-root user for security
USER node

# Expose backend port
EXPOSE 5000

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Start production server
CMD ["node", "server.js"]
