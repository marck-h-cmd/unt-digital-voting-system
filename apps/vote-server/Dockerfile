# backend/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependencias del sistema
RUN apk add --no-cache python3 make g++

# Copiar archivos de dependencias
COPY package*.json ./
COPY tsconfig*.json ./

# Instalar dependencias
RUN npm ci --legacy-peer-deps

# Copiar código fuente
COPY src ./src

# Construir aplicación
RUN npm run build

# Stage de producción
FROM node:20-alpine

WORKDIR /app

# Instalar dependencias de producción
COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps

# Copiar build
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Crear directorios para logs
RUN mkdir -p logs

# Exponer puerto
EXPOSE 3000

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=3000

# Comando de inicio
CMD ["node", "dist/main"]