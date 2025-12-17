# 🚀 Быстрый старт — Telegram Course Platform (MVP v3.0)

## Что есть
✅ Backend (NestJS): структура, TypeORM, модели; готово к PostgreSQL/SQLite.  
✅ Frontend (React + Vite): структура, Telegram WebApp SDK, Tailwind, TanStack Query, роутинг.  
❗ Без DEMO/заглушек: оплата активна (внешняя ссылка), промокоды боевые.

## 📋 Предварительные требования
- Node.js 18+
- npm или yarn
- Git
- Telegram Bot Token (через @BotFather)

## 🏃 Шаг 1: Установка зависимостей
### Backend
```bash
cd backend
npm install
```
### Frontend
```bash
cd frontend
npm install
```

## ⚙️ Шаг 2: Настройка окружения
### Backend
```bash
cd backend
cp .env.example .env
```
Заполни: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `DATABASE_URL` (или отдельные параметры), `FRONTEND_URL` (для CORS/webhook), `REDIS` если используется.

### Frontend
```bash
cd frontend
cp .env.example .env
```
Заполни:
```
VITE_API_URL=http://localhost:3000/api
VITE_TELEGRAM_BOT_USERNAME=...
```

## 🗄️ Шаг 3: База данных
- SQLite создастся автоматически при первом запуске backend (локально).  
- Для PostgreSQL укажи `DATABASE_URL`.

## 🚀 Шаг 4: Запуск приложения
### Терминал 1: Backend
```bash
cd backend
npm run start:dev
```
Backend: http://localhost:3000 /api

### Терминал 2: Frontend
```bash
cd frontend
npm run dev
```
Frontend: http://localhost:5173

## ✅ Проверка работы
1) Открой http://localhost:5173  
2) API доступно на http://localhost:3000/api

## 🤖 Настройка Telegram Bot (без ngrok)
1) Создай бота в @BotFather → токен в `.env` backend.  
2) Menu Button (Mini App): Bot Settings → Menu Button → URL фронта (стейдж/прод домен).  
3) Webhook:  
```bash
curl -F "url=https://<backend-domain>/telegram/webhook" \
     https://api.telegram.org/bot<TOKEN>/setWebhook
```

## 📂 Структура проекта (ключевые)
```
telegram-course-platform/
├── backend/
├── frontend/
├── docs/
│   ├── PRD_Telegram_Course_Platform_MVP_v3_0.md
│   ├── v0_prompts_v3_0.md
│   ├── IMPLEMENTATION_PLAN_V3.md
│   └── TECHNICAL_DECOMPOSITION.md
├── README.md
├── QUICK_START.md
└── .gitignore
```

## 🔧 Полезные команды
### Backend
```bash
npm run start:dev
npm run build
npm run start:prod
npm run lint
npm run test
```
### Frontend
```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run test
```

## 🐛 Troubleshooting
- Backend не стартует: проверь `.env`, порты, переустанови `node_modules`.
- Frontend не стартует: проверь `.env`, порты, переустанови `node_modules`.
- SQLite ошибки: удалите `backend/database.sqlite` и перезапустите.
- CORS: проверь `FRONTEND_URL` в backend `.env`.

## 📚 Следующие шаги
- Реализовать функционал по PRD v3.0: расписание уроков, промокоды (free/%/фикс), оплаты (внешняя ссылка), чаты, материалы/видео, обложки, мультикурсовость.
- Смотри: [README](./README.md), [PRD v3.0](./docs/PRD_Telegram_Course_Platform_MVP_v3_0.md), [v0_prompts_v3_0](./docs/v0_prompts_v3_0.md), [Implementation Plan v3](./docs/IMPLEMENTATION_PLAN_V3.md).

## 🎉 Готово к разработке!



