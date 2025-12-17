# Backend - Telegram Course Platform

Backend API на NestJS для Telegram Course Platform MVP v2.1

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка окружения

Скопируй `.env.example` в `.env` и заполни:

```bash
cp .env.example .env
```

Обязательно укажи:
- `TELEGRAM_BOT_TOKEN` - токен от @BotFather
- `TELEGRAM_BOT_USERNAME` - username твоего бота

### 3. Запуск базы данных

SQLite создастся автоматически при первом запуске. Файл `database.sqlite` появится в корне backend.

### 4. Запуск seed данных (опционально)

```bash
npm run seed
```

Это создаст дефолтный промокод "WELCOME".

### 5. Запуск приложения

```bash
# Development mode (с автоперезагрузкой)
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

Backend запустится на http://localhost:3000

## 📁 Структура проекта

```
src/
├── config/              # Конфигурация (TypeORM, и т.д.)
├── database/
│   └── seeds/          # Seed данные
├── modules/
│   ├── users/          # Модуль пользователей
│   │   └── entities/
│   ├── courses/        # Модуль курсов
│   │   └── entities/
│   ├── streams/        # Модуль потоков
│   │   └── entities/
│   ├── payments/       # Mock-биллинг
│   │   └── entities/
│   ├── promo-codes/    # Промокоды
│   │   └── entities/
│   └── notifications/  # Уведомления
│       └── entities/
├── app.module.ts        # Главный модуль
└── main.ts             # Entry point
```

## 🗄️ База данных

### SQLite (для разработки)

По умолчанию используется SQLite. Файл БД: `database.sqlite`

**Преимущества:**
- ✅ Не требует установки PostgreSQL
- ✅ Файловая БД (легко бэкапить)
- ✅ Идеально для локальной разработки

### Переход на PostgreSQL (для продакшена)

Просто измени `.env`:

```bash
DATABASE_TYPE=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=telegram_course_platform
```

TypeORM автоматически переключится на PostgreSQL!

## 🧪 Тестирование

```bash
# Unit тесты
npm run test

# E2E тесты
npm run test:e2e

# Покрытие кода
npm run test:cov
```

## 📝 API Endpoints

### Auth
- `POST /api/auth/activate` - Активация ученика по access_token

### Users
- `GET /api/users/me` - Текущий пользователь

### Courses
- `POST /api/courses` - Создать курс
- `GET /api/courses` - Список курсов
- `GET /api/courses/:id` - Детали курса
- `PATCH /api/courses/:id` - Обновить курс
- `DELETE /api/courses/:id` - Удалить курс

### Blocks
- `POST /api/courses/:id/blocks` - Создать блок
- `PATCH /api/blocks/:id` - Обновить блок
- `DELETE /api/blocks/:id` - Удалить блок
- `PATCH /api/blocks/reorder` - Изменить порядок

### Lessons
- `POST /api/blocks/:id/lessons` - Создать урок
- `PATCH /api/lessons/:id` - Обновить урок
- `DELETE /api/lessons/:id` - Удалить урок
- `POST /api/lessons/:id/upload-video` - Загрузить видео
- `GET /api/lessons/:id/transcription` - Получить транскрибацию (демо)

### Streams
- `POST /api/streams` - Создать поток
- `GET /api/streams` - Список потоков
- `GET /api/streams/:id` - Детали потока
- `POST /api/streams/:id/students` - Добавить учеников
- `GET /api/streams/:id/students` - Список учеников
- `POST /api/streams/:id/broadcast` - Отправить рассылку

### Payments (Mock-биллинг)
- `POST /api/payments/apply-promo` - Применить промокод
- `GET /api/payments/status` - Статус оплаты
- `GET /api/payments/analytics/:streamId` - Аналитика платежей

## 🔧 Технологии

- **NestJS** - прогрессивный Node.js фреймворк
- **TypeORM** - ORM для работы с БД
- **SQLite** - файловая БД для разработки
- **node-telegram-bot-api** - Telegram Bot API
- **class-validator** - валидация DTO
- **Jest** - тестирование

## 📦 Переход на продакшн

### 1. Меняем БД на PostgreSQL

```bash
# .env
DATABASE_TYPE=postgres
DATABASE_HOST=your_postgres_host
DATABASE_PORT=5432
DATABASE_USER=your_user
DATABASE_PASSWORD=your_password
DATABASE_NAME=telegram_course_platform
```

### 2. Билд проекта

```bash
npm run build
```

### 3. Запуск

```bash
npm run start:prod
```

## 🐛 Troubleshooting

### База данных не создается

Убедись, что в `.env` указано:
```bash
DATABASE_TYPE=sqlite
DATABASE_NAME=database.sqlite
```

### Ошибки TypeORM

Проверь, что все entity импортированы в `typeorm.config.ts`:
```typescript
entities: [path.join(__dirname, '../**/*.entity{.ts,.js}')]
```

### Telegram Bot не работает

1. Проверь токен в `.env`
2. Убедись, что бот создан через @BotFather
3. Проверь, что webhook настроен (для продакшена)

## 📚 Документация

- [Техническая декомпозиция](../docs/TECHNICAL_DECOMPOSITION.md)
- [PRD v2.1](../docs/PRD_Telegram_Course_Platform_MVP_v2.1.md)



