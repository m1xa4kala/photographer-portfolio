# Stage 1: Build frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# Stage 2: Build backend
FROM node:22-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci
COPY backend/ .
RUN npm run build

# Stage 3: Production runtime
FROM node:22-alpine AS production
WORKDIR /app

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Copy built backend
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/package.json ./backend/
COPY --from=backend-builder /app/backend/package-lock.json ./backend/

# Install only production dependencies (no devDependencies like Jest, ESLint, etc.)
# This avoids shipping deprecated glob@7, inflight, and other dev-only packages
RUN cd backend && npm ci --omit=dev

# Create uploads directory for runtime
RUN mkdir -p /app/uploads && chown -R node:node /app/uploads

# Switch to non-root user for security
USER node

# Healthcheck
RUN apk add --no-cache curl
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

EXPOSE 3000

CMD ["node", "backend/dist/src/main"]