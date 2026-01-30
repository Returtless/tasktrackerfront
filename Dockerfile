# Multi-stage build for Vue.js frontend

# Stage 1: Build
FROM node:18-alpine AS build
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Stage 2: Copy to backend static (will be used in docker-compose)
FROM alpine:latest AS dist
WORKDIR /app
COPY --from=build /app/dist ./dist

# This stage just prepares the dist folder
# The actual serving will be done by Spring Boot in the backend container

