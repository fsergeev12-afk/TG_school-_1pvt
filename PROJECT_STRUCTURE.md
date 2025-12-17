# 📂 Структура проекта - Telegram Course Platform

## ✅ Что создано

### 📁 Корневой уровень

```
telegram-course-platform/
├── backend/                    # NestJS Backend
├── frontend/                   # React Frontend
├── docs/                       # Документация
├── .gitignore                 # Git ignore правила
├── README.md                  # Основное описание
├── QUICK_START.md            # Инструкция для быстрого старта
└── PROJECT_STRUCTURE.md      # Этот файл
```

---

### 📁 Backend (NestJS)

```
backend/
├── src/
│   ├── config/
│   │   └── typeorm.config.ts          # Конфигурация TypeORM (SQLite/PostgreSQL)
│   │
│   ├── database/
│   │   └── seeds/
│   │       └── run-seeds.ts           # Seed данные (промокод "WELCOME")
│   │
│   ├── modules/
│   │   ├── users/
│   │   │   └── entities/
│   │   │       └── user.entity.ts     # Entity пользователей
│   │   │
│   │   ├── courses/
│   │   │   └── entities/
│   │   │       ├── course.entity.ts   # Entity курсов
│   │   │       ├── block.entity.ts    # Entity блоков
│   │   │       └── lesson.entity.ts   # Entity уроков
│   │   │
│   │   ├── streams/
│   │   │   └── entities/
│   │   │       ├── stream.entity.ts          # Entity потоков
│   │   │       └── stream-student.entity.ts  # Entity учеников в потоках
│   │   │
│   │   ├── payments/
│   │   │   └── entities/
│   │   │       └── payment.entity.ts  # Entity платежей (mock-биллинг)
│   │   │
│   │   ├── promo-codes/
│   │   │   └── entities/
│   │   │       └── promo-code.entity.ts  # Entity промокодов
│   │   │
│   │   └── notifications/
│   │       └── entities/
│   │           ├── notification.entity.ts           # Entity уведомлений
│   │           ├── lesson-progress.entity.ts        # Entity прогресса (для v1.0)
│   │           └── notification-template.entity.ts  # Entity шаблонов (для v1.0)
│   │
│   ├── app.module.ts           # Главный модуль приложения
│   └── main.ts                 # Entry point
│
├── package.json                # Зависимости и скрипты
├── tsconfig.json              # TypeScript конфигурация
├── nest-cli.json              # NestJS CLI конфигурация
├── .eslintrc.js               # ESLint правила
├── .prettierrc                # Prettier правила
├── .env.example               # Пример .env файла
├── .env                       # Переменные окружения (НЕ в Git!)
├── README.md                  # Документация backend
└── database.sqlite            # SQLite БД (создастся автоматически, НЕ в Git!)
```

**Всего Entity моделей:** 10 (все готовы к использованию)

---

### 📁 Frontend (React + Vite)

```
frontend/
├── src/
│   ├── api/
│   │   └── client.ts                  # Axios клиент для API
│   │
│   ├── hooks/
│   │   └── useTelegram.ts            # Hook для Telegram WebApp SDK
│   │
│   ├── components/
│   │   └── shared/
│   │       └── LoadingScreen.tsx      # Компонент загрузки
│   │
│   ├── pages/
│   │   ├── creator/
│   │   │   └── CreatorDashboard.tsx   # Кабинет создателя (заглушка)
│   │   │
│   │   └── student/
│   │       ├── StudentDashboard.tsx   # Кабинет ученика (заглушка)
│   │       └── PaymentScreen.tsx      # Экран оплаты (mock-биллинг)
│   │
│   ├── App.tsx                        # Главный компонент
│   ├── main.tsx                       # Entry point
│   └── index.css                      # Глобальные стили (Tailwind)
│
├── public/                            # Статические файлы
├── index.html                         # HTML шаблон
├── package.json                       # Зависимости и скрипты
├── vite.config.ts                     # Vite конфигурация
├── tsconfig.json                      # TypeScript конфигурация
├── tsconfig.node.json                 # TypeScript для Vite
├── tailwind.config.js                 # Tailwind CSS конфигурация
├── postcss.config.js                  # PostCSS конфигурация
├── .env.example                       # Пример .env файла
├── .env                               # Переменные окружения (НЕ в Git!)
└── README.md                          # Документация frontend
```

**Базовые страницы:** 3 (creator, student, payment)

---

### 📁 Документация

```
docs/
├── PRD_Telegram_Course_Platform_MVP_v2.1.md       # Полное Product Requirements Document
├── PRD_Telegram_Course_Platform_MVP_v2.1_SHORT.md # Сокращенная версия PRD
├── TECHNICAL_DECOMPOSITION.md                      # Техническая декомпозиция (полная)
└── STACK_SIMPLIFIED.md                            # Упрощенный стек (SQLite, без Docker/Redis)
```

---

## 📊 Статистика проекта

### Backend:
- ✅ **10 Entity моделей** (users, courses, blocks, lessons, streams, stream_students, payments, promo_codes, notifications, lesson_progress, notification_templates)
- ✅ **TypeORM** настроен (SQLite для dev, PostgreSQL для prod)
- ✅ **Seed данные** готовы (промокод "WELCOME")
- ✅ **Конфигурация** для локальной разработки

### Frontend:
- ✅ **3 основные страницы** (creator, student, payment)
- ✅ **Telegram WebApp SDK** интегрирован
- ✅ **Tailwind CSS** настроен (Mobile-First)
- ✅ **TanStack Query** подключен
- ✅ **API клиент** готов (axios с интерцепторами)

### Документация:
- ✅ **4 документа** (PRD полное, PRD короткое, техническая декомпозиция, упрощенный стек)
- ✅ **3 README** (основной, backend, frontend)
- ✅ **2 Quick Start** (основной, PROJECT_STRUCTURE)

---

## 🎯 Готовность к разработке

### ✅ Что уже работает:
- Backend запускается (`npm run start:dev`)
- Frontend запускается (`npm run dev`)
- SQLite БД создается автоматически
- TypeORM готов к миграции на PostgreSQL
- Все Entity модели определены
- Базовый роутинг работает
- Telegram WebApp SDK подключен

### 🚧 Что нужно создать дальше:
- Модули backend (сервисы, контроллеры, DTO)
- API endpoints
- Telegram Bot интеграция
- Frontend компоненты (формы, списки, карточки)
- Drag-and-drop для блоков и уроков
- Систему уведомлений
- Тесты

---

## 📦 Зависимости

### Backend (package.json):
```json
{
  "@nestjs/common": "^10.0.0",
  "@nestjs/core": "^10.0.0",
  "@nestjs/typeorm": "^10.0.0",
  "@nestjs/config": "^3.1.1",
  "typeorm": "^0.3.17",
  "sqlite3": "^5.1.6",
  "node-telegram-bot-api": "^0.64.0",
  "uuid": "^9.0.1"
}
```

### Frontend (package.json):
```json
{
  "react": "^18.2.0",
  "react-router-dom": "^6.20.0",
  "@tanstack/react-query": "^5.8.4",
  "axios": "^1.6.2",
  "tailwindcss": "^3.3.5"
}
```

---

## 🔧 Настройка окружения

### Backend (.env):
```bash
NODE_ENV=development
PORT=3000
DATABASE_TYPE=sqlite
DATABASE_NAME=database.sqlite
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_BOT_USERNAME=your_bot_username
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env):
```bash
VITE_API_URL=http://localhost:3000/api
VITE_TELEGRAM_BOT_USERNAME=your_bot_username
```

---

## 🚀 Команды для запуска

### Backend:
```bash
cd backend
npm install          # Установка зависимостей
npm run start:dev    # Запуск в dev mode
npm run seed         # Загрузка seed данных (опционально)
```

### Frontend:
```bash
cd frontend
npm install          # Установка зависимостей
npm run dev          # Запуск в dev mode
```

---

## 📚 Полезные ссылки

- [QUICK_START.md](../QUICK_START.md) - Детальная инструкция по запуску
- [README.md](../README.md) - Общее описание проекта
- [Backend README](../backend/README.md) - Документация backend
- [Frontend README](../frontend/README.md) - Документация frontend
- [TECHNICAL_DECOMPOSITION.md](./TECHNICAL_DECOMPOSITION.md) - План разработки

---

## ✅ Итог

**Базовая структура проекта полностью готова!**

Можно начинать разработку функционала:
1. Создавать API endpoints в backend
2. Создавать компоненты в frontend
3. Интегрировать Telegram Bot
4. Добавлять тесты

**Все файлы конфигурации созданы, зависимости определены, архитектура спроектирована! 🚀**



