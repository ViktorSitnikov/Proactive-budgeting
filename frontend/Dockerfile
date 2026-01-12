# Этап 1: Установка зависимостей
FROM node:20-alpine AS deps
WORKDIR /app

# Копируем файлы конфигурации пакетов
COPY package.json package-lock.json* pnpm-lock.yaml* ./

# Устанавливаем зависимости
RUN \
  if [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i; \
  elif [ -f package-lock.json ]; then npm ci; \
  else npm install; \
  fi

# Этап 2: Сборка приложения
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Аргументы сборки (передаем URL API на этапе билда для Next.js)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-http://localhost:4000/api}

# Отключаем телеметрию Next.js
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Этап 3: Запуск приложения
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Создаем пользователя для безопасности
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Настройка кеша и прав доступа
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Копируем результаты сборки
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["npm", "start"]

