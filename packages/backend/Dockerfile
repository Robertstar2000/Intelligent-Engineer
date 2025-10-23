# Backend Dockerfile for Intelligent Engineering Platform 2.0
FROM node:18-alpine AS base

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++ curl

WORKDIR /app

# Copy package files
COPY package.json ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN npm install --workspace=@intelligent-engineering/backend --workspace=@intelligent-engineering/shared

# Copy source code
COPY packages/backend ./packages/backend
COPY packages/shared ./packages/shared

# Build shared types
RUN npm run build --workspace=@intelligent-engineering/shared

# Build backend
RUN npm run build --workspace=@intelligent-engineering/backend

# Production stage
FROM node:18-alpine AS production

RUN apk add --no-cache curl

WORKDIR /app

# Copy package files
COPY package.json ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/shared/package.json ./packages/shared/

# Install production dependencies only
RUN npm ci --workspace=@intelligent-engineering/backend --workspace=@intelligent-engineering/shared --only=production

# Copy built application
COPY --from=base /app/packages/backend/dist ./packages/backend/dist
COPY --from=base /app/packages/shared/dist ./packages/shared/dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S backend -u 1001

# Change ownership
RUN chown -R backend:nodejs /app
USER backend

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

CMD ["node", "packages/backend/dist/index.js"]