# Frontend - Telegram Course Platform

React приложение для Telegram Mini Web App (MVP v2.1)

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка окружения

Скопируй `.env.example` в `.env`:

```bash
cp .env.example .env
```

Обязательно укажи:
- `VITE_API_URL` - URL backend API (http://localhost:3000/api для локальной разработки)
- `VITE_TELEGRAM_BOT_USERNAME` - username твоего бота

### 3. Запуск приложения

```bash
# Development mode (с hot reload)
npm run dev

# Build для продакшена
npm run build

# Предпросмотр production build
npm run preview
```

Frontend запустится на http://localhost:5173

## 📁 Структура проекта

```
src/
├── api/                 # API клиент (axios)
├── components/
│   ├── creator/        # Компоненты для создателей
│   ├── student/        # Компоненты для учеников
│   └── shared/         # Общие компоненты
├── hooks/              # React hooks
│   └── useTelegram.ts  # Telegram WebApp SDK
├── pages/
│   ├── creator/        # Страницы создателя
│   └── student/        # Страницы ученика
├── types/              # TypeScript типы
├── utils/              # Утилиты
├── App.tsx             # Главный компонент
├── main.tsx            # Entry point
└── index.css           # Глобальные стили
```

## 🎨 Технологии

- **React 18** - UI библиотека
- **TypeScript** - типизация
- **Vite** - быстрая сборка
- **Tailwind CSS** - Mobile-First стили
- **TanStack Query** - state management и кеширование
- **React Router** - роутинг
- **Axios** - HTTP клиент
- **Telegram WebApp SDK** - интеграция с Telegram

## 🎯 Основные фичи

### Для создателей:
- ✅ Создание и редактирование курсов
- ✅ Управление блоками и уроками (drag-and-drop)
- ✅ Создание потоков
- ✅ Добавление учеников через Telegram
- ✅ Централизованная рассылка
- ✅ Mock-биллинг (аналитика платежей)

### Для учеников:
- ✅ Личный кабинет с курсами
- ✅ Просмотр видео и материалов
- ✅ Экран оплаты с промокодами
- ✅ Демо-транскрибация

## 🔧 Разработка

### Telegram WebApp SDK

Приложение использует `window.Telegram.WebApp` API:

```typescript
import { useTelegram } from '@/hooks/useTelegram';

function MyComponent() {
  const { webApp, user, startParam } = useTelegram();
  
  // webApp - объект Telegram WebApp API
  // user - данные пользователя из Telegram
  // startParam - параметр из deep link (access_token)
}
```

### API клиент

Все запросы идут через `apiClient`:

```typescript
import { apiClient } from '@/api/client';

// GET запрос
const courses = await apiClient.get('/courses');

// POST запрос
const newCourse = await apiClient.post('/courses', data);
```

### Tailwind CSS

Используем Telegram theme colors:

```tsx
<div className="bg-telegram-bg text-telegram-text">
  <button className="bg-telegram-button text-telegram-buttonText">
    Кнопка
  </button>
</div>
```

## 📱 Тестирование на мобильном

### Локальная сеть

1. Узнай свой IP: `ipconfig` (Windows) или `ifconfig` (Mac/Linux)
2. Запусти dev server: `npm run dev`
3. Открой на телефоне: `http://192.168.x.x:5173`

### Через ngrok

1. Установи ngrok: https://ngrok.com/download
2. Запусти туннель: `ngrok http 5173`
3. Получишь URL: `https://abc123.ngrok.io`
4. Настрой Mini App через @BotFather с этим URL

## 🧪 Тестирование

```bash
# Запуск тестов
npm run test

# Тесты с UI
npm run test:ui
```

## 📦 Build для продакшена

```bash
# Сборка
npm run build

# Предпросмотр
npm run preview
```

Результат сборки: `dist/` (готов к деплою)

## 🚀 Деплой

### Vercel (рекомендуется)

1. Push в GitHub
2. Подключи репозиторий в Vercel
3. Настрой environment variables:
   - `VITE_API_URL` - URL твоего backend
   - `VITE_TELEGRAM_BOT_USERNAME` - username бота
4. Автодеплой при каждом push!

### Netlify

1. Push в GitHub
2. Подключи репозиторий в Netlify
3. Build command: `npm run build`
4. Publish directory: `dist`

## 🐛 Troubleshooting

### Telegram WebApp SDK не загружается

Убедись, что в `index.html` подключен скрипт:
```html
<script src="https://telegram.org/js/telegram-web-app.js"></script>
```

### CORS ошибки

Проверь, что backend разрешает запросы с frontend URL (CORS настройки в NestJS).

### Стили не применяются

Убедись, что в `index.css` импортированы Tailwind директивы:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## 📚 Документация

- [Техническая декомпозиция](../../docs/TECHNICAL_DECOMPOSITION.md)
- [PRD v2.1](../../docs/PRD_Telegram_Course_Platform_MVP_v2.1.md)
- [Telegram WebApp SDK](https://core.telegram.org/bots/webapps)



