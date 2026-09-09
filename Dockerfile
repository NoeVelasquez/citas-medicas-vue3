FROM node:20-alpine

WORKDIR /app

# Copiar manifiestos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el código fuente completo
COPY . .

# Exponer los puertos de Frontend (5173) y Backend (3000)
EXPOSE 5173 3000

# Comando para iniciar ambos servicios concurrentemente
CMD ["npm", "run", "serve"]
