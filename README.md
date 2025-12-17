# 📚 Telegram Course Platform MVP v3.0

Платформа для создания и продажи онлайн-курсов через Telegram Mini App.

## ✨ Возможности

### Для создателей курсов
- 📖 Мультикурсовость — создавайте неограниченное количество курсов
- 🎬 Гибридное видео — загрузка до 50MB или внешние ссылки (YouTube, Vimeo)
- 👥 Потоки учеников — группируйте учеников с разным расписанием
- 📅 Автоматическое расписание — уроки открываются по датам
- 💳 Промокоды — бесплатный доступ или скидки
- 💬 Чаты — общение с учениками через Telegram
- 📊 Аналитика — статистика продаж и прогресса

### Для учеников
- 📱 Мобильный интерфейс — оптимизировано для Telegram
- 🎓 Доступ к урокам — видео + материалы PDF/DOC
- 📈 Прогресс обучения — отслеживание пройденных уроков
- 🔔 Уведомления — оповещения о новых уроках

## 🛠 Технологии

### Backend
- **NestJS** — TypeScript фреймворк
- **TypeORM** — ORM для работы с БД
- **SQLite/PostgreSQL** — база данных
- **Telegram Bot API** — интеграция с Telegram

### Frontend
- **React 18** + TypeScript
- **Vite** — сборка
- **TailwindCSS** — стили
- **React Query** — работа с API
- **Zustand** — состояние
- **Telegram WebApp SDK**

## 🚀 Быстрый старт

### Требования
- Node.js 18+
- npm или yarn
- Telegram Bot Token (от @BotFather)

### Backend

```bash
cd backend

# Установка зависимостей
npm install

# Скопируйте env.example в .env и настройте
cp env.example .env

# Запуск в режиме разработки
npm run start:dev
```

### Frontend

```bash
cd frontend

# Установка зависимостей
npm install

# Скопируйте env.example в .env
cp env.example .env

# Запуск
npm run dev
```

## 📁 Структура проекта

```
├── backend/
│   ├── src/
│   │   ├── config/           # Конфигурация TypeORM
│   │   └── modules/
│   │       ├── auth/         # Аутентификация Telegram
│   │       ├── users/        # Пользователи
│   │       ├── courses/      # Курсы, блоки, уроки
│   │       ├── streams/      # Потоки + расписание
│   │       ├── promo-codes/  # Промокоды
│   │       ├── payments/     # Платежи
│   │       ├── chats/        # Диалоги
│   │       ├── notifications/# Уведомления + cron
│   │       ├── files/        # Загрузка файлов
│   │       └── telegram-bot/ # Telegram Bot
│   └── env.example
│
├── frontend/
│   ├── src/
│   │   ├── api/              # API клиент + хуки
│   │   ├── components/       # UI компоненты
│   │   ├── pages/            # Страницы
│   │   ├── store/            # Zustand stores
│   │   └── types/            # TypeScript типы
│   └── env.example
│
└── docs/                     # Документация
    ├── PRD_*.md              # Требования
    ├── WORK_PLAN_V3.md       # План работ
    └── ...
```

## 📱 API Endpoints

### Курсы
```
POST   /api/courses              - Создать курс
GET    /api/courses              - Список курсов
GET    /api/courses/:id          - Получить курс
PATCH  /api/courses/:id          - Обновить
DELETE /api/courses/:id          - Удалить
POST   /api/courses/:id/publish  - Опубликовать
```

### Потоки
```
POST   /api/streams              - Создать поток
GET    /api/streams              - Список потоков
GET    /api/streams/:id/students - Ученики потока
POST   /api/streams/:id/schedule - Расписание
```

### Промокоды
```
POST   /api/promo-codes          - Создать
GET    /api/promo-codes          - Список
POST   /api/promo-codes/public/validate - Проверить
```

### Платежи
```
GET    /api/payments/stats       - Статистика
POST   /api/payments/public/init - Инициировать
```

### Чаты
```
GET    /api/chats                - Диалоги
POST   /api/chats/:id/send       - Отправить
```

## 🔐 Безопасность

- HMAC валидация Telegram initData
- Защита endpoints по ролям (creator/student)
- Уникальные access_token для учеников

## 📋 TODO (v3.1)

- [ ] Интеграция с платёжной системой (ЮKassa)
- [ ] Bull Queue для очередей уведомлений
- [ ] Редактор курсов с drag-and-drop
- [ ] Прогресс просмотра видео
- [ ] Экспорт статистики в Excel

## 📄 Лицензия

MIT

---

Made with ❤️ for Telegram
