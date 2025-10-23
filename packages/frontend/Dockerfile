# Frontend Dockerfile for Intelligent Engineering Platform 2.0
FROM node:18-alpine AS base

WORKDIR /app

# Copy package files
COPY package.json ./
COPY packages/frontend/package.json ./packages/frontend/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN npm install --workspace=@intelligent-engineering/frontend --workspace=@intelligent-engineering/shared

# Copy source code
COPY packages/frontend ./packages/frontend
COPY packages/shared ./packages/shared

# Build shared types
RUN npm run build --workspace=@intelligent-engineering/shared

# Development stage
FROM base AS development

EXPOSE 3000

CMD ["npm", "run", "dev", "--workspace=@intelligent-engineering/frontend"]

# Production build stage
FROM base AS build

# Build frontend
RUN npm run build --workspace=@intelligent-engineering/frontend

# Production stage
FROM nginx:alpine AS production

# Copy built application
COPY --from=build /app/packages/frontend/dist /usr/share/nginx/html

# Copy nginx configuration
COPY packages/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]