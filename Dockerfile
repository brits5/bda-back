# Etapa 1: Construcción
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./
COPY . .

RUN npm install
RUN npm run build

# Etapa 2: Producción
FROM node:20-alpine

WORKDIR /app

# Instala mysql client para ejecutar el .sql
RUN apk add --no-cache mysql-client

# Copia solo lo necesario
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.env .env
COPY --from=builder /app/sql/db.sql ./db.sql

# Variables de entorno para acceso a la DB (puedes usar ARG si prefieres)
ENV DB_HOST=mysql.railway.internal
ENV DB_PORT=3306
ENV DB_USERNAME=root
ENV DB_PASSWORD=thCWTjRYhdRaJIVELSQvqswtGOFNhBHQ
ENV DB_DATABASE=railway

# Ejecuta el SQL antes de iniciar la app
RUN mysql -h$DB_HOST -P$DB_PORT -u$DB_USERNAME -p$DB_PASSWORD $DB_DATABASE < db.sql || echo "No se pudo ejecutar db.sql, probablemente ya esté aplicado."

EXPOSE 3000

CMD ["node", "dist/main"]
