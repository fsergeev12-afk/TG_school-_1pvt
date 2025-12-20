FROM node:20-alpine

WORKDIR /app

# Копируем backend
COPY backend/package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходники backend
COPY backend/ ./

# Собираем проект
RUN npm run build

# Запускаем
CMD ["node", "dist/main.js"]

