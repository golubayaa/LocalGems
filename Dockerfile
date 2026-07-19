# ==========================================
# Stage 1: Build React app с Vite
# ==========================================
FROM node:20-alpine AS build

WORKDIR /app

# Копируем только файлы зависимостей (для кэширования Docker layers)
COPY package.json package-lock.json* .npmrc* ./

# Устанавливаем зависимости
# --legacy-peer-deps игнорирует конфликты peer dependencies
# --no-audit и --no-fund ускоряют установку
RUN npm install --legacy-peer-deps --no-audit --no-fund

# Копируем все исходники
COPY . .

# ⚠️ Переменные окружения для Vite (встраиваются в JS-бандл при сборке)
# По умолчанию пустая строка — будет использоваться относительный путь /api
# Можно переопределить при сборке: docker build --build-arg VITE_API_URL=https://api.example.com
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

# Сборка (результат упадет в /app/dist)
RUN npm run build

# ==========================================
# Stage 2: Production образ с Nginx
# ==========================================
FROM nginx:alpine AS production

# Удаляем дефолтный конфиг nginx
RUN rm /etc/nginx/conf.d/default.conf

# Копируем наш кастомный конфиг
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Копируем собранные статические файлы из первого stage
COPY --from=build /app/dist /usr/share/nginx/html

# Добавляем health-check endpoint (создаем файл /health)
RUN echo "healthy" > /usr/share/nginx/html/health

# Открываем порт
EXPOSE 80

# Nginx в foreground (чтобы Docker видел процесс и не завершал контейнер)
CMD ["nginx", "-g", "daemon off;"]