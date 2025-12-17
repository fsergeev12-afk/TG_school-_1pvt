# Техническая декомпозиция MVP v3.0

Основа: `PRD_Telegram_Course_Platform_MVP_v3_0.md`, `v0_prompts_v3_0.md`, `IMPLEMENTATION_PLAN_V3.md`. Этот документ обновлён под v3.0; ниже оставлены части v2.1 как легаси, их надо заменить при детальной проработке.

## Кратко: что поменялось в v3.0 (vs v2.1)
- Нет DEMO/заглушек: оплата активна (внешняя ссылка), промокоды боевые.
- Чаты: централизованный inbox, диалоги, непрочитанные; ответы через Bot API.
- Расписание по урокам: cron открывает уроки, Telegram-уведомления.
- Промокоды: free/%/фикс, лимиты, сроки, учёт использований (`promo_code_usages`).
- Оплаты: внешняя ссылка (провайдер TBD, вероятно ЮKassa); UI успех/ошибка, реальные метрики на вкладке «Оплаты».
- Мультикурсовость; обложки курсов (JPG/PNG 5MB); гибридное видео (file_id до 50MB или внешняя ссылка); материалы (PDF/DOC 50MB).
- Статусы учеников: Приглашен+не оплачено / Активен+не оплачено / Активен+оплачено.
- Новые таблицы: `promo_code_usages`, `lesson_schedules`, `lesson_materials`, `conversations`, `messages`; расширения `courses`, `lessons`, `blocks`, `streams`, `stream_students`.

## Стек (актуально)
- Backend: NestJS (TS), TypeORM, PostgreSQL 15+ (или SQLite локально), Redis (очереди), node-telegram-bot-api.
- Frontend: React 18 + TS, Vite, Tailwind, TanStack Query, Telegram WebApp SDK, DnD Kit.
- Хранение медиа: Telegram file_id (видео/материалы до лимитов Bot API), обложки — CDN/S3.
- Инфраструктура: Docker Compose (pg/redis), без ngrok по умолчанию (используем боевой/стейджинг домен для webhook/Menu Button).

## Модули (актуально)
- Auth/Users
- Courses (обложки, блоки/уроки, видео типы, материалы)
- Streams (расписание уроков, цена, schedule_enabled)
- Promo Codes (3 типа, лимиты, expiry, usage tracking)
- Payments (внешняя ссылка, статус платежа; webhook-стаб до выбора провайдера)
- Chats (conversations/messages, непрочитанные, Bot API)
- Notifications/Cron (расписание уроков, sendMessage через бота)
- Telegram Bot (webhook, deep link stream_id, отправка уведомлений/ответов)

## Данные (миграции v3.0 — кратко)
- `promo_code_usages` (promo_code_id, student_id, used_at, UNIQUE по promo+student).
- `lesson_schedules` (lesson_id, stream_id, scheduled_open_at, is_opened, notification_sent).
- `lesson_materials` (lesson_id, file_name, file_type pdf/doc, file_size_bytes, telegram_file_id).
- `conversations` (creator_id, student_id nullable, stream_id nullable, telegram_chat_id, last_message_at, unread_count).
- `messages` (conversation_id, sender_type creator/student, text, telegram_message_id nullable, is_read, created_at).
- Расширения:  
  - `courses`: cover_image_url, description.  
  - `blocks`: description.  
  - `lessons`: video_type ('telegram'/'external'), video_telegram_file_id, video_external_url, description.  
  - `streams`: price (INT), schedule_enabled (BOOL).  
  - `stream_students`: invitation_status ('invited'/'activated'), payment_status ('unpaid'/'paid'), activated_at, paid_at.

## Флоу оплаты (v3.0)
- Front: экран оплаты → проверка/применение промокода → redirect на внешнюю ссылку провайдера → возвращение с параметрами успех/ошибка → UI модалка.
- Back: endpoint создания платежной ссылки (провайдер TBD, ЮKassa вероятно); храним транзакцию/статус; webhook провайдера — заглушка до выбора.

## Флоу расписания (v3.0)
- Cron (1-5 мин): ищет `lesson_schedules` с `scheduled_open_at <= now AND is_opened=false`, открывает урок, шлёт уведомления Bot API только оплаченным ученикам потока, ставит `notification_sent=true`.

## Флоу чатов (v3.0)
- Webhook Telegram: сохраняем message → conversation (creator_id + telegram_chat_id, stream_id nullable, student_id nullable) → unread_count++.  
- UI «Чаты»: список с фильтром по потокам, непрочитанные, статусы ученика.  
- Ответ создателя: POST → Bot API sendMessage, помечаем прочитанным.

---

Ниже — легаси-секции v2.1 (для удаления/замены по мере обновления):

---

## Технологический стек

### Backend
- **NestJS (TypeScript)** - модульная архитектура, готовая к масштабированию
- **PostgreSQL 15+** - основная БД с UUID, индексами, JSONB поддержкой
- **TypeORM** - ORM для работы с БД
- **node-telegram-bot-api** - работа с Telegram Bot API
- **Bull + Redis** - очереди для асинхронных задач (рассылки, загрузка видео)

### Frontend
- **React 18 + TypeScript**
- **Vite** - быстрая сборка
- **Telegram WebApp SDK** - интеграция с Telegram Mini App
- **TanStack Query** - кеширование и state management
- **Tailwind CSS** - Mobile-First UI
- **DnD Kit** - drag-and-drop для блоков и уроков

### Infrastructure
- **Git + GitHub** - version control
- **ngrok** - туннелирование для тестирования на мобильном
- **Docker Compose** - локальная разработка (PostgreSQL, Redis)

### File Storage
- **Telegram File Storage** (через Bot API) - видео до 2GB

---

## Архитектура проекта

```
telegram-course-platform/
├── backend/                      # NestJS backend
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/            # Аутентификация через Telegram
│   │   │   ├── users/           # Пользователи (creator/student)
│   │   │   ├── courses/         # Курсы, блоки, уроки
│   │   │   ├── streams/         # Потоки и ученики
│   │   │   ├── notifications/   # Уведомления через бота
│   │   │   ├── payments/        # Mock-биллинг (v2.1)
│   │   │   ├── promo-codes/     # Промокоды (v2.1)
│   │   │   └── telegram-bot/    # Telegram Bot интеграция
│   │   ├── config/              # Конфигурация
│   │   ├── database/            # Миграции
│   │   └── main.ts
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                     # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── creator/         # Интерфейс создателя
│   │   │   │   ├── courses/     # Управление курсами
│   │   │   │   ├── streams/     # Управление потоками
│   │   │   │   └── payments/    # Mock-биллинг UI (v2.1)
│   │   │   └── student/         # Интерфейс ученика
│   │   │       ├── dashboard/   # Личный кабинет
│   │   │       ├── course/      # Просмотр курсов
│   │   │       └── payment/     # Экран оплаты (v2.1)
│   │   ├── hooks/               # Telegram WebApp SDK
│   │   ├── api/                 # API клиент
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── docker-compose.yml            # PostgreSQL + Redis
└── README.md
```

---

## Схема базы данных (расширенная для v2.1)

### Основные таблицы

```sql
-- Пользователи
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_id BIGINT UNIQUE NOT NULL,
  telegram_username VARCHAR(255),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  role VARCHAR(50) NOT NULL, -- 'creator' | 'student'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_role ON users(role);

-- Курсы
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  cover_url VARCHAR(1000), -- для v1.0 (в MVP - NULL)
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP -- soft-delete для v1.0
);

CREATE INDEX idx_courses_creator_id ON courses(creator_id);
CREATE INDEX idx_courses_published ON courses(is_published);

-- Блоки курсов
CREATE TABLE blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_blocks_course_id ON blocks(course_id);
CREATE INDEX idx_blocks_display_order ON blocks(display_order);

-- Уроки
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  block_id UUID NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  content_type VARCHAR(50) NOT NULL, -- 'video_upload' | 'external_link' | 'online_meeting'
  
  -- Для video_upload
  video_file_id VARCHAR(500), -- Telegram file_id
  video_duration INT, -- секунды
  
  -- Для external_link
  external_url VARCHAR(1000),
  
  -- Для online_meeting
  meeting_url VARCHAR(1000),
  meeting_start_at TIMESTAMP,
  
  -- Общие поля
  display_order INT NOT NULL DEFAULT 0,
  scheduled_open_at TIMESTAMP, -- для v1.0 (расписание открытия)
  
  -- AI-транскрибация (демо в MVP)
  transcription_text TEXT, -- для v1.0 (реальная транскрибация)
  has_demo_transcription BOOLEAN DEFAULT false, -- для MVP (показывать демо-шаблон)
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_lessons_block_id ON lessons(block_id);
CREATE INDEX idx_lessons_display_order ON lessons(display_order);
CREATE INDEX idx_lessons_content_type ON lessons(content_type);

-- Потоки
CREATE TABLE streams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL, -- "Группа ноябрь 2024"
  
  -- Настройки уведомлений (в MVP захардкожены)
  send_welcome BOOLEAN DEFAULT true, -- захардкожено в MVP
  send_first_lesson_notification BOOLEAN DEFAULT true, -- захардкожено в MVP
  notify_on_new_lesson BOOLEAN DEFAULT false, -- для v1.0 (кликабельная заглушка в MVP)
  
  -- Mock-биллинг (v2.1)
  require_payment BOOLEAN DEFAULT false, -- требовать оплату
  price_amount INT DEFAULT 0, -- цена в копейках (в MVP = 0)
  currency VARCHAR(10) DEFAULT 'RUB',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP -- soft-delete для v1.0
);

CREATE INDEX idx_streams_creator_id ON streams(creator_id);
CREATE INDEX idx_streams_course_id ON streams(course_id);

-- Ученики в потоках
CREATE TABLE stream_students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stream_id UUID NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- может быть NULL до активации
  
  -- Telegram данные (v2.1)
  telegram_id BIGINT UNIQUE NOT NULL, -- для защиты от складчины
  telegram_username VARCHAR(255), -- для кнопки "Написать"
  telegram_first_name VARCHAR(255),
  telegram_last_name VARCHAR(255),
  
  -- Статусы
  status VARCHAR(50) NOT NULL DEFAULT 'invited', -- 'invited' | 'activated'
  
  -- Mock-биллинг (v2.1)
  payment_status VARCHAR(50) DEFAULT 'not_required', -- 'not_required' | 'pending' | 'paid'
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  
  -- Уникальная ссылка доступа
  access_token UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
  
  invited_at TIMESTAMP DEFAULT NOW(),
  activated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_stream_students_stream_id ON stream_students(stream_id);
CREATE INDEX idx_stream_students_user_id ON stream_students(user_id);
CREATE INDEX idx_stream_students_telegram_id ON stream_students(telegram_id);
CREATE INDEX idx_stream_students_access_token ON stream_students(access_token);
CREATE INDEX idx_stream_students_status ON stream_students(status);

-- Промокоды (v2.1)
CREATE TABLE promo_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(100) UNIQUE NOT NULL, -- "WELCOME"
  type VARCHAR(50) NOT NULL DEFAULT 'free', -- 'free' | 'discount' | 'bonus'
  discount_value INT, -- размер скидки в % (nullable)
  expires_at TIMESTAMP, -- срок действия (nullable)
  is_active BOOLEAN DEFAULT true,
  usage_limit INT, -- лимит использований (nullable = безлимитный)
  used_count INT DEFAULT 0, -- счетчик использований
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_promo_codes_is_active ON promo_codes(is_active);

-- Платежи (v2.1)
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stream_id UUID NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
  amount INT DEFAULT 0, -- в копейках (в MVP = 0)
  currency VARCHAR(10) DEFAULT 'RUB',
  payment_method VARCHAR(50) NOT NULL, -- 'promo' | 'card' | 'telegram_stars' | 'stripe'
  promo_code_id UUID REFERENCES promo_codes(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending' | 'paid' | 'failed' | 'refunded'
  paid_at TIMESTAMP,
  payment_provider_id VARCHAR(500), -- ID транзакции у провайдера (для v1.0)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_stream_id ON payments(stream_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_paid_at ON payments(paid_at);

-- Прогресс учеников (для v1.0, в MVP не используется)
CREATE TABLE lesson_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

CREATE INDEX idx_lesson_progress_user_id ON lesson_progress(user_id);
CREATE INDEX idx_lesson_progress_lesson_id ON lesson_progress(lesson_id);

-- Уведомления (логирование)
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stream_id UUID REFERENCES streams(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'welcome' | 'demo' | 'broadcast' | 'new_lesson'
  message TEXT NOT NULL,
  sent_at TIMESTAMP DEFAULT NOW(),
  delivery_status VARCHAR(50) DEFAULT 'sent', -- 'sent' | 'failed' | 'delivered'
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_stream_id ON notifications(stream_id);
CREATE INDEX idx_notifications_type ON notifications(type);

-- Шаблоны уведомлений (для v1.0, в MVP не используется)
CREATE TABLE notification_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'welcome' | 'new_lesson'
  message_template TEXT NOT NULL, -- с плейсхолдерами
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notification_templates_creator_id ON notification_templates(creator_id);
```

---

## Этапы разработки

### Этап 1: Инфраструктура и база (2-3 дня)

**Цель:** Подготовить фундамент для разработки с полной БД для v2.1.

**Задачи:**
1. Инициализация проектов (backend NestJS + frontend React)
2. Docker Compose для PostgreSQL + Redis
3. Создание всех таблиц БД с миграциями (включая promo_codes и payments)
4. Seed данные для разработки (включая дефолтный промокод "WELCOME")
5. Git репозиторий + .gitignore

**Seed данные:**
```sql
-- Дефолтный промокод для MVP
INSERT INTO promo_codes (code, type, is_active, created_at) 
VALUES ('WELCOME', 'free', true, NOW());
```

**Ключевые файлы:**
- `backend/database/migrations/1700000000000-InitialSchema.ts`
- `backend/database/seeds/1700000001000-DefaultPromoCode.ts`
- `docker-compose.yml`

**Результат:** Локальное окружение готово, БД создана с полной поддержкой v2.1, можно начинать разработку модулей.

---

### Этап 2: Telegram Bot + Auth (2-3 дня)

**Цель:** Настроить Telegram Bot и аутентификацию через Telegram WebApp.

**Задачи:**
1. Создание бота через @BotFather
2. Настройка Telegram Bot API в NestJS
3. Webhook для обработки команд /start
4. Auth middleware для Telegram WebApp (валидация initData)
5. Определение роли (creator/student) при первом входе
6. Извлечение telegram_id, username для новых пользователей

**Ключевые файлы:**
- `backend/src/modules/telegram-bot/telegram-bot.module.ts`
- `backend/src/modules/telegram-bot/telegram-bot.service.ts`
- `backend/src/modules/telegram-bot/telegram-bot.gateway.ts`
- `backend/src/modules/auth/auth.module.ts`
- `backend/src/modules/auth/guards/telegram-auth.guard.ts`
- `backend/src/modules/auth/decorators/current-user.decorator.ts`

**Пример middleware:**
```typescript
// auth.guard.ts
@Injectable()
export class TelegramAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const initData = request.headers['x-telegram-init-data'];
    
    // Валидация initData через crypto
    const isValid = this.validateTelegramInitData(initData);
    if (!isValid) {
      throw new UnauthorizedException('Invalid Telegram auth data');
    }
    
    // Извлечение user данных
    const telegramUser = this.parseTelegramUser(initData);
    
    // Поиск или создание пользователя
    let user = await this.usersService.findByTelegramId(telegramUser.id);
    if (!user) {
      user = await this.usersService.create({
        telegram_id: telegramUser.id,
        telegram_username: telegramUser.username,
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name,
        role: 'student' // по умолчанию
      });
    }
    
    request.user = user;
    return true;
  }
}
```

**Результат:** Бот отвечает на /start, пользователи могут авторизоваться через Telegram Mini App.

---

### Этап 3: Backend API - Курсы (3-4 дня)

**Цель:** Реализовать CRUD для курсов, блоков и уроков.

**Задачи:**
1. CRUD для courses
2. CRUD для blocks + display_order + drag-and-drop reorder
3. CRUD для lessons (все 3 типа контента: video_upload, external_link, online_meeting)
4. Загрузка видео в Telegram File Storage
5. Бизнес-логика: ограничение "только 1 курс" для создателя
6. Демо-транскрибация (флаг has_demo_transcription)

**API эндпоинты:**
```
POST   /api/courses
GET    /api/courses
GET    /api/courses/:id
PATCH  /api/courses/:id
DELETE /api/courses/:id

POST   /api/courses/:id/blocks
PATCH  /api/blocks/:id
DELETE /api/blocks/:id
PATCH  /api/blocks/reorder          # Drag-and-drop

POST   /api/blocks/:id/lessons
PATCH  /api/lessons/:id
DELETE /api/lessons/:id
PATCH  /api/lessons/reorder         # Drag-and-drop

POST   /api/lessons/:id/upload-video
GET    /api/lessons/:id/transcription  # Возвращает демо-шаблон
```

**Ключевая логика (courses.service.ts):**
```typescript
async create(creatorId: string, dto: CreateCourseDto) {
  // MVP ограничение: только 1 курс
  const existingCoursesCount = await this.courseRepository.count({
    where: { creatorId, deletedAt: IsNull() }
  });
  
  if (existingCoursesCount >= 1) {
    throw new BadRequestException('MVP limit: only 1 course allowed');
  }
  
  // Создание курса...
  return await this.courseRepository.save({
    ...dto,
    creatorId,
    isPublished: true
  });
}
```

**Демо-транскрибация (lessons.service.ts):**
```typescript
async getTranscription(lessonId: string) {
  const lesson = await this.lessonRepository.findOne({ where: { id: lessonId } });
  
  if (!lesson) {
    throw new NotFoundException('Lesson not found');
  }
  
  // В MVP возвращаем универсальный демо-шаблон
  return {
    isDemo: true,
    content: this.getDemoTranscriptionTemplate() // универсальный шаблон "Основы тайм-менеджмента"
  };
}
```

**Результат:** Создатель может создать курс с блоками и уроками через API.

---

### Этап 4: Backend API - Потоки (3-4 дня)

**Цель:** Реализовать систему потоков для управления группами учеников.

**Задачи:**
1. CRUD для streams
2. Создание потока с привязкой к курсу
3. Генерация уникальных access_token (UUID) для учеников
4. Добавление учеников в поток (через Telegram Share Picker на фронте, здесь только API)
5. Получение списка учеников со статусами (invited/activated) + статусами оплаты
6. Удаление ученика из потока
7. **Фиксация telegram_id при добавлении ученика (v2.1)**
8. **API для проверки статуса оплаты (v2.1)**

**API эндпоинты:**
```
POST   /api/streams
GET    /api/streams
GET    /api/streams/:id
PATCH  /api/streams/:id
DELETE /api/streams/:id

POST   /api/streams/:id/students          # Добавить учеников
GET    /api/streams/:id/students          # Список учеников + статусы оплаты
DELETE /api/streams/:id/students/:studentId

POST   /api/streams/:id/broadcast         # Ручная рассылка

# v2.1 - Mock-биллинг
GET    /api/streams/:id/payment-analytics  # Аналитика платежей (демо-данные)
```

**Ключевая логика добавления ученика (streams.service.ts):**
```typescript
async addStudents(streamId: string, telegramIds: number[]) {
  const stream = await this.streamRepository.findOne({ where: { id: streamId } });
  
  if (!stream) {
    throw new NotFoundException('Stream not found');
  }
  
  const students = [];
  
  for (const telegramId of telegramIds) {
    // Проверка: может ли этот telegram_id получить доступ
    const existingStudent = await this.streamStudentRepository.findOne({
      where: { telegram_id: telegramId, stream_id: streamId }
    });
    
    if (existingStudent) {
      continue; // уже добавлен
    }
    
    // Создание записи со статусом 'invited'
    const student = await this.streamStudentRepository.save({
      stream_id: streamId,
      telegram_id: telegramId,
      status: 'invited',
      payment_status: stream.require_payment ? 'pending' : 'not_required',
      access_token: uuid(), // уникальный токен
      invited_at: new Date()
    });
    
    students.push(student);
    
    // Триггер отправки welcome сообщения через бота
    await this.notificationsService.sendWelcomeMessage(student);
  }
  
  return students;
}
```

**Результат:** Создатель может создавать потоки и добавлять учеников.

---

### Этап 5: Backend API - Mock-биллинг (2-3 дня) ✨ НОВОЕ v2.1

**Цель:** Реализовать демо-монетизацию с промокодами и защитой от "складчины".

**Задачи:**
1. CRUD для promo_codes (в MVP только чтение дефолтного "WELCOME")
2. Проверка промокода при активации ученика
3. Создание записи в payments при успешной "оплате"
4. Обновление payment_status в stream_students
5. Защита через telegram_id (один ID = один доступ)
6. API для аналитики платежей (демо-данные)
7. Генератор промокодов (API готово, UI-заглушка)

**API эндпоинты:**
```
# Промокоды
GET    /api/promo-codes              # Список промокодов создателя
POST   /api/promo-codes              # Создать промокод (для v1.0, в MVP отключено)
POST   /api/promo-codes/validate     # Проверить промокод

# Платежи
POST   /api/payments/apply-promo     # Применить промокод (для ученика)
GET    /api/payments/status          # Статус оплаты текущего пользователя
GET    /api/payments/analytics/:streamId  # Аналитика платежей потока (демо-данные)
```

**Ключевая логика применения промокода (payments.service.ts):**
```typescript
async applyPromoCode(
  telegramId: number, 
  streamId: string, 
  promoCode: string
) {
  // 1. Найти ученика по telegram_id + stream_id
  const student = await this.streamStudentRepository.findOne({
    where: { telegram_id: telegramId, stream_id: streamId }
  });
  
  if (!student) {
    throw new NotFoundException('Student not found in this stream');
  }
  
  // 2. Проверить статус оплаты
  if (student.payment_status === 'paid') {
    throw new BadRequestException('Already paid');
  }
  
  // 3. Валидация промокода
  const promo = await this.promoCodeRepository.findOne({
    where: { code: promoCode, is_active: true }
  });
  
  if (!promo) {
    throw new BadRequestException('Promo code not found or expired');
  }
  
  // Проверка лимита использований
  if (promo.usage_limit && promo.used_count >= promo.usage_limit) {
    throw new BadRequestException('Promo code usage limit reached');
  }
  
  // Проверка срока действия
  if (promo.expires_at && new Date() > promo.expires_at) {
    throw new BadRequestException('Promo code expired');
  }
  
  // 4. Создать запись в payments
  const payment = await this.paymentRepository.save({
    user_id: student.user_id,
    stream_id: streamId,
    amount: 0, // в MVP = 0 (промокод = бесплатный доступ)
    currency: 'RUB',
    payment_method: 'promo',
    promo_code_id: promo.id,
    status: 'paid',
    paid_at: new Date()
  });
  
  // 5. Обновить статус ученика
  await this.streamStudentRepository.update(
    { id: student.id },
    { 
      payment_status: 'paid',
      payment_id: payment.id
    }
  );
  
  // 6. Увеличить счетчик использований промокода
  await this.promoCodeRepository.update(
    { id: promo.id },
    { used_count: promo.used_count + 1 }
  );
  
  return { success: true, payment };
}
```

**Аналитика платежей (payments.service.ts):**
```typescript
async getStreamPaymentAnalytics(streamId: string) {
  // В MVP возвращаем демо-данные для демонстрации
  const students = await this.streamStudentRepository.find({
    where: { stream_id: streamId }
  });
  
  const totalInvited = students.length;
  const totalPaid = students.filter(s => s.payment_status === 'paid').length;
  const conversionRate = totalInvited > 0 
    ? Math.round((totalPaid / totalInvited) * 100) 
    : 0;
  
  return {
    isDemo: true, // флаг для фронтенда
    totalInvited,
    totalPaid,
    conversionRate,
    revenue: totalPaid * 3000 // демо-данные (фиксированная цена)
  };
}
```

**Результат:** Mock-биллинг работает с промокодами, защита от "складчины" реализована.

---

### Этап 6: Telegram Bot - Уведомления (2-3 дня)

**Цель:** Реализовать отправку уведомлений через Telegram Bot.

**Задачи:**
1. Отправка объединенного сообщения (welcome) через бота
2. Демо-уведомление через 10 секунд (Bull queue + Redis)
3. Ручная рассылка от создателя всем активированным ученикам
4. Дублирование ссылки в каждом сообщении
5. Логирование в таблицу notifications

**Архитектура уведомлений:**
```
┌──────────────┐
│   API call   │ (добавить ученика / отправить рассылку)
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│ Notifications    │
│ Service          │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Bull Queue       │ (асинхронная обработка)
│ (Redis)          │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Telegram Bot API │ (отправка сообщения)
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ notifications    │ (логирование)
│ table            │
└──────────────────┘
```

**Типы уведомлений:**

1. **Welcome** (при добавлении в поток):
```typescript
async sendWelcomeMessage(student: StreamStudent) {
  const stream = await this.streamsService.findOne(student.stream_id);
  const creator = await this.usersService.findOne(stream.creator_id);
  const course = await this.coursesService.findOne(stream.course_id);
  
  const message = `🎓 Привет! ${creator.first_name} приглашает тебя 
на курс "${course.title}"!

Переходи на платформу, чтобы начать обучение:
🔗 ${this.generateAccessLink(student.access_token)}

📌 Закрепи это сообщение — здесь всегда 
будет актуальная ссылка на курс!`;

  await this.notificationQueue.add('send-telegram-message', {
    telegram_id: student.telegram_id,
    message,
    student_id: student.id,
    type: 'welcome'
  });
}
```

2. **Demo** (через 10 сек после активации):
```typescript
async sendDemoNotification(student: StreamStudent) {
  const stream = await this.streamsService.findOne(student.stream_id);
  const creator = await this.usersService.findOne(stream.creator_id);
  
  const message = `📚 Новый урок доступен!

От ${creator.first_name}:
Переходи на платформу, чтобы начать обучение.
🔗 ${this.generateAccessLink(student.access_token)}`;

  await this.notificationQueue.add('send-telegram-message', {
    telegram_id: student.telegram_id,
    message,
    student_id: student.id,
    type: 'demo'
  }, {
    delay: 10000 // 10 секунд
  });
}
```

3. **Manual Broadcast** (ручная рассылка):
```typescript
async sendBroadcast(streamId: string, messageText: string, creatorId: string) {
  const stream = await this.streamsService.findOne(streamId);
  const creator = await this.usersService.findOne(creatorId);
  
  // Отправляется только активированным ученикам
  const students = await this.streamStudentRepository.find({
    where: { stream_id: streamId, status: 'activated' }
  });
  
  for (const student of students) {
    const message = `От ${creator.first_name}:
${messageText}

🔗 ${this.generateAccessLink(student.access_token)}`;

    await this.notificationQueue.add('send-telegram-message', {
      telegram_id: student.telegram_id,
      message,
      student_id: student.id,
      type: 'broadcast'
    });
  }
}
```

**Результат:** Бот отправляет уведомления ученикам автоматически и по запросу создателя.

---

### Этап 7: Активация учеников (1-2 дня)

**Цель:** Реализовать активацию учеников по уникальной ссылке с проверкой payment_status.

**Задачи:**
1. Обработка access_token из URL
2. Фиксация telegram_id при первом переходе
3. Проверка payment_status (require_payment)
4. Обновление статуса invited → activated (только если оплачено или не требуется оплата)
5. Запуск демо-уведомления через 10 сек (при активации)
6. Связывание stream_student с user (создание user если нужно)

**API эндпоинты:**
```
POST   /api/auth/activate              # Активация по access_token
GET    /api/auth/payment-required      # Проверка: нужна ли оплата
```

**Flow активации:**
```typescript
// auth.service.ts
async activate(accessToken: string, telegramUser: TelegramUser) {
  // 1. Найти запись по access_token
  const student = await this.streamStudentRepository.findOne({
    where: { access_token: accessToken }
  });
  
  if (!student) {
    throw new NotFoundException('Invalid access token');
  }
  
  // 2. Проверка telegram_id (защита от "складчины")
  if (student.telegram_id !== telegramUser.id) {
    throw new ForbiddenException('This link is not for you');
  }
  
  // 3. Получить поток и проверить require_payment
  const stream = await this.streamsService.findOne(student.stream_id);
  
  if (stream.require_payment && student.payment_status !== 'paid') {
    // Возвращаем флаг: нужна оплата
    return {
      requirePayment: true,
      stream,
      student
    };
  }
  
  // 4. Создать или найти пользователя
  let user = await this.usersService.findByTelegramId(telegramUser.id);
  if (!user) {
    user = await this.usersService.create({
      telegram_id: telegramUser.id,
      telegram_username: telegramUser.username,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
      role: 'student'
    });
  }
  
  // 5. Обновить статус на 'activated'
  await this.streamStudentRepository.update(
    { id: student.id },
    { 
      status: 'activated',
      user_id: user.id,
      activated_at: new Date()
    }
  );
  
  // 6. Запустить демо-уведомление через 10 сек
  await this.notificationsService.sendDemoNotification(student);
  
  // 7. Вернуть данные пользователя и доступные курсы
  const courses = await this.coursesService.findByStudent(user.id);
  
  return {
    requirePayment: false,
    user,
    courses
  };
}
```

**Результат:** Ученики активируются по ссылке с проверкой оплаты (если требуется).

---

### Этап 8: Frontend - Creator Dashboard (5-6 дней)

**Цель:** Реализовать интерфейс для создателя курсов с поддержкой mock-биллинга.

**Задачи:**
1. Telegram WebApp SDK интеграция
2. Роутинг (creator/student)
3. Вкладка "Курсы": список, создание, редактирование
4. Drag-and-drop для блоков и уроков (DnD Kit)
5. Загрузка видео / вставка ссылки
6. Демо-транскрибация (заглушка с бейджем [DEMO])
7. Вкладка "Потоки": список, создание
8. Telegram Share Picker интеграция
9. Детальная страница потока: ученики, рассылка, настройки
10. **Вкладка "💳 Оплаты [DEMO]" с аналитикой (v2.1)**
11. **Кнопка "💬 Написать" для связи с учениками (v2.1)**
12. **Экран генератора промокодов (UI-заглушка) (v2.1)**
13. Интерактивные заглушки (чекбоксы без функционала)

**Компоненты:**
```
CreatorDashboard.tsx
├── Navigation.tsx (переключение вкладок)
├── CoursesList.tsx
│   └── CourseEditor.tsx
│       ├── BlocksList.tsx (drag-and-drop)
│       └── LessonEditor.tsx
│           ├── VideoUpload.tsx
│           ├── ExternalLink.tsx
│           ├── OnlineMeeting.tsx
│           └── DemoTranscriptionButton.tsx [DEMO]
└── StreamsList.tsx
    ├── StreamCreator.tsx
    │   ├── CourseSelector.tsx
    │   ├── NotificationSettings.tsx (чекбоксы, захардкожены)
    │   ├── PaymentSettings.tsx (v2.1) [чекбокс "Требовать оплату"]
    │   └── SharePickerButton.tsx
    └── StreamDetails.tsx
        ├── StudentsList.tsx
        │   ├── StudentCard.tsx (с кнопкой "💬 Написать")
        │   └── PaymentStatusBadge.tsx (💳/⏳)
        ├── BroadcastMessage.tsx
        ├── PaymentAnalytics.tsx (v2.1) [вкладка "💳 Оплаты [DEMO]"]
        │   └── PromoCodesScreen.tsx (UI-заглушка)
        └── StreamSettings.tsx
```

**Telegram WebApp SDK:**
```typescript
// hooks/useTelegram.ts
import { useEffect, useState } from 'react';

export const useTelegram = () => {
  const [webApp, setWebApp] = useState<any>(null);
  
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      tg.setHeaderColor('#1e293b'); // темный header
      setWebApp(tg);
    }
  }, []);
  
  return webApp;
};
```

**Share Picker (приглашение учеников):**
```typescript
// components/SharePickerButton.tsx
const handleInviteStudents = async () => {
  const webApp = window.Telegram.WebApp;
  
  if (!webApp.openTelegramLink) {
    alert('Share Picker недоступен');
    return;
  }
  
  // Генерируем уникальный access_token для каждого ученика на backend
  // Здесь упрощенно: Share Picker отправит сообщение с ссылкой
  const inviteUrl = `https://t.me/${botUsername}?start=${streamId}`;
  
  // Открываем Share Picker (бот отправит сообщение в выбранные чаты)
  webApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent('Приглашение на курс')}`);
  
  // Альтернатива: использовать Telegram.WebApp.shareMessage() если доступен
};
```

**Кнопка "💬 Написать" (v2.1):**
```typescript
// components/StudentCard.tsx
const StudentCard = ({ student }) => {
  const handleOpenChat = () => {
    if (!student.telegram_username) {
      alert('У ученика нет @username');
      return;
    }
    
    // Deep link на чат в Telegram
    window.Telegram.WebApp.openTelegramLink(`https://t.me/${student.telegram_username}`);
  };
  
  return (
    <div className="student-card">
      <div className="student-info">
        <span>{student.telegram_first_name} {student.telegram_last_name}</span>
        <div className="status">
          {student.status === 'activated' ? '✅ Активен' : '⏳ Приглашен'}
          {student.payment_status === 'paid' && ' 💳 Оплачено'}
          {student.payment_status === 'pending' && ' ⏳ Не оплачено'}
        </div>
      </div>
      <div className="actions">
        <button 
          onClick={handleOpenChat}
          disabled={!student.telegram_username}
          className="btn-write"
        >
          💬 Написать
        </button>
        <button onClick={() => handleRemove(student.id)} className="btn-remove">
          ❌
        </button>
      </div>
    </div>
  );
};
```

**Экран аналитики платежей (v2.1):**
```typescript
// components/PaymentAnalytics.tsx
const PaymentAnalytics = ({ streamId }) => {
  const { data, isLoading } = useQuery(['payment-analytics', streamId], 
    () => api.getStreamPaymentAnalytics(streamId)
  );
  
  if (isLoading) return <Spinner />;
  
  return (
    <div className="payment-analytics">
      <h2>💰 Аналитика платежей [DEMO]</h2>
      <div className="stats">
        <div className="stat-item">
          <span>Переходов:</span>
          <span>{data.totalInvited}</span>
        </div>
        <div className="stat-item">
          <span>Оплачено:</span>
          <span>{data.totalPaid}</span>
        </div>
        <div className="stat-item">
          <span>Конверсия:</span>
          <span>{data.conversionRate}%</span>
        </div>
        <div className="stat-item">
          <span>Выручка:</span>
          <span>[DEMO] {data.revenue.toLocaleString('ru-RU')}₽</span>
        </div>
      </div>
      
      <button 
        onClick={() => navigate(`/streams/${streamId}/promo-codes`)}
        className="btn-promo-codes"
      >
        🎟️ Промокоды [DEMO]
      </button>
      
      <p className="demo-notice">
        ℹ️ Это демонстрация будущего функционала монетизации
      </p>
    </div>
  );
};
```

**Экран генератора промокодов (UI-заглушка, v2.1):**
```typescript
// components/PromoCodesScreen.tsx
const PromoCodesScreen = ({ streamId }) => {
  return (
    <div className="promo-codes-screen">
      <h2>🎟️ Промокоды [DEMO]</h2>
      
      <div className="active-promo-codes">
        <h3>Активные промокоды:</h3>
        <div className="promo-code-item">
          <span className="code">WELCOME</span>
          <span className="type">Бесплатный доступ</span>
          <span className="usage">Использований: ∞</span>
          <span className="badge">Дефолтный</span>
        </div>
      </div>
      
      <button 
        disabled 
        className="btn-create-promo disabled"
        title="Функционал будет доступен после MVP"
      >
        ➕ Создать промокод
      </button>
      
      <p className="demo-notice">
        ℹ️ Функционал генерации промокодов будет доступен после MVP
      </p>
    </div>
  );
};
```

**Результат:** Создатель может управлять курсами и потоками через UI с поддержкой mock-биллинга.

---

### Этап 9: Frontend - Student Interface (2-3 дня)

**Цель:** Реализовать интерфейс для учеников с экраном оплаты (v2.1).

**Задачи:**
1. **Экран оплаты с промокодом (v2.1)**
2. Личный кабинет с курсами (1 рабочий + 2 заглушки)
3. Просмотр структуры курса (блоки → уроки)
4. Просмотр урока:
   - Видео плеер (загруженное)
   - Внешняя ссылка (кнопка)
   - Онлайн-встреча (логика до/после)
5. Демо-транскрибация
6. Навигация между уроками

**Компоненты:**
```
StudentDashboard.tsx
├── PaymentScreen.tsx (v2.1) [НОВОЕ]
│   └── PromoCodeInput.tsx
└── CourseList.tsx
    ├── CourseCard.tsx (рабочий)
    ├── CourseStub.tsx (заглушка x2)
    └── CourseView.tsx
        ├── BlocksList.tsx
        └── LessonView.tsx
            ├── VideoPlayer.tsx
            ├── ExternalLinkButton.tsx
            ├── OnlineMeetingButton.tsx
            └── DemoTranscription.tsx
```

**Экран оплаты (v2.1):**
```typescript
// components/PaymentScreen.tsx
const PaymentScreen = ({ stream, accessToken }) => {
  const [promoCode, setPromoCode] = useState('');
  const [error, setError] = useState('');
  const applyPromo = useMutation(api.applyPromoCode);
  
  const handleApplyPromo = async () => {
    try {
      const result = await applyPromo.mutateAsync({
        accessToken,
        promoCode
      });
      
      if (result.success) {
        // Переход на личный кабинет
        navigate('/student/dashboard');
      }
    } catch (err) {
      setError('Промокод не найден или истек');
    }
  };
  
  return (
    <div className="payment-screen">
      <h2>💳 Оплата курса</h2>
      
      <div className="course-preview">
        <div className="course-cover">{/* Дефолтная обложка */}</div>
        <h3>{stream.course.title}</h3>
        <p>От {stream.creator.first_name}</p>
        <p>{stream.course.lessons_count} уроков в {stream.course.blocks_count} блоках</p>
      </div>
      
      <div className="payment-info">
        <p>Стоимость: 3,000₽</p>
        <button disabled className="btn-pay">
          Оплатить (недоступно)
        </button>
        <p className="demo-notice">
          ℹ️ Реальные платежи пока не подключены
        </p>
      </div>
      
      <div className="promo-code-section">
        <h3>🎁 Есть промокод?</h3>
        <input 
          type="text" 
          value={promoCode}
          onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
          placeholder="Введите промокод"
        />
        <button onClick={handleApplyPromo} className="btn-apply">
          Применить
        </button>
        {error && <p className="error">{error}</p>}
        <p className="hint">💡 Попробуйте: WELCOME</p>
      </div>
    </div>
  );
};
```

**Логика при активации (App.tsx):**
```typescript
// App.tsx
const App = () => {
  const webApp = useTelegram();
  const [requirePayment, setRequirePayment] = useState(false);
  const [stream, setStream] = useState(null);
  
  useEffect(() => {
    if (!webApp) return;
    
    const startParam = webApp.initDataUnsafe?.start_param;
    if (startParam) {
      // Активация по access_token
      activateStudent(startParam);
    }
  }, [webApp]);
  
  const activateStudent = async (accessToken: string) => {
    try {
      const result = await api.activate(accessToken);
      
      if (result.requirePayment) {
        // Показать экран оплаты
        setRequirePayment(true);
        setStream(result.stream);
      } else {
        // Перейти на личный кабинет
        navigate('/student/dashboard');
      }
    } catch (err) {
      alert('Ошибка активации');
    }
  };
  
  if (requirePayment) {
    return <PaymentScreen stream={stream} />;
  }
  
  return <Router>...</Router>;
};
```

**Логика онлайн-встречи:**
```typescript
const OnlineMeetingButton = ({ lesson }) => {
  const now = new Date();
  const meetingStart = new Date(lesson.meetingStartAt);
  const isBefore = now < meetingStart;
  
  if (isBefore) {
    return (
      <div className="meeting-before">
        <button disabled className="btn-meeting">
          🔴 Подключиться к эфиру
        </button>
        <div className="meeting-time">
          {format(meetingStart, 'dd.MM.yyyy в HH:mm')}
        </div>
        <Countdown to={meetingStart} />
      </div>
    );
  } else {
    return (
      <button 
        onClick={() => window.open(lesson.meetingUrl, '_blank')}
        className="btn-meeting"
      >
        📹 Смотреть запись
      </button>
    );
  }
};
```

**Результат:** Ученики видят экран оплаты (если требуется), могут активироваться по промокоду и изучать материалы.

---

### Этап 10: Mobile Testing Setup (1 день)

**Цель:** Настроить окружение для тестирования на реальных мобильных устройствах.

**Задачи:**
1. Настройка ngrok для HTTPS туннеля
2. Конфигурация Telegram Bot webhook на ngrok URL
3. Telegram Mini App domain setup
4. Тестирование на реальном телефоне

**Инструкция:**
```bash
# 1. Установить ngrok
# https://ngrok.com/download

# 2. Запустить туннель для backend
ngrok http 3000

# 3. Обновить .env
NGROK_URL=https://abc123.ngrok.io

# 4. Настроить webhook для бота
curl -F "url=https://abc123.ngrok.io/telegram/webhook" \
     https://api.telegram.org/bot<TOKEN>/setWebhook

# 5. Запустить туннель для frontend
ngrok http 5173

# 6. Настроить Mini App domain через @BotFather
# /mybots → выбрать бота → Bot Settings → Menu Button → Configure menu button
# URL: https://def456.ngrok.io
```

**Результат:** Можно тестировать приложение на реальном телефоне через Telegram.

---

### Этап 11: Тестирование и баги (3-5 дней)

**Цель:** Протестировать все флоу и исправить баги.

**Задачи:**
1. E2E тестирование полного флоу (создатель + ученик + mock-биллинг)
2. Тестирование на мобильном
3. Исправление багов
4. Performance проверка (запросы к БД, индексы)
5. Документация README

**Тестовые сценарии:**

**Сценарий 1: Создатель создает курс и запускает поток с биллингом (v2.1)**
1. Регистрация как creator
2. Создание курса с 2 блоками и 4 уроками
3. Попытка создать второй курс → ошибка "MVP limit"
4. Создание потока с включенным биллингом (☑️ Требовать оплату)
5. Добавление 3 учеников через Share Picker
6. Проверка статусов (все invited, payment_status = pending)

**Сценарий 2: Ученик активируется с промокодом и изучает курс (v2.1)**
1. Получение ссылки от создателя
2. Клик по ссылке → открытие Mini App
3. Отображается экран оплаты
4. Ввод промокода "WELCOME"
5. Статус меняется на activated + payment_status = paid
6. Через 10 сек получение демо-уведомления
7. Просмотр списка курсов (1 рабочий + 2 заглушки)
8. Открытие курса → просмотр блоков и уроков
9. Просмотр урока с видео
10. Просмотр демо-транскрибации

**Сценарий 3: Создатель проверяет статусы оплаты (v2.1)**
1. Открытие детальной страницы потока
2. Проверка списка учеников со статусами оплаты (💳/⏳)
3. Клик на кнопку "💬 Написать" → открывается чат в Telegram
4. Переход на вкладку "💳 Оплаты [DEMO]"
5. Просмотр аналитики (демо-данные)
6. Открытие экрана промокодов (UI-заглушка)

**Сценарий 4: Создатель отправляет рассылку**
1. Открытие детальной страницы потока
2. Переход на вкладку "Рассылка"
3. Написание сообщения
4. Отправка всем активированным ученикам
5. Проверка получения сообщения учениками

**Сценарий 5: Защита от "складчины" (v2.1)**
1. Ученик А получает ссылку и активируется с промокодом
2. Ученик А пересылает ссылку ученику Б
3. Ученик Б кликает по ссылке
4. Система проверяет telegram_id
5. Ученик Б видит ошибку "This link is not for you"

**Performance тесты:**
- Загрузка курса с 50 уроками
- Список из 100 учеников в потоке
- Одновременная рассылка 1000 ученикам

**Результат:** Все основные флоу работают стабильно на desktop и mobile, включая mock-биллинг.

---

## Ключевые технические решения

### 1. Масштабируемость с первого дня

**UUID везде:**
```typescript
@PrimaryGeneratedColumn('uuid')
id: string;
```

**Индексы на FK:**
```typescript
@Index(['creatorId', 'isPublished'])
@Index(['telegramId']) // v2.1
@Index(['paymentStatus']) // v2.1
```

**Bull queues для рассылок:**
```typescript
await this.notificationQueue.add('send-welcome', {
  userId,
  streamId,
}, {
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 }
});
```

### 2. Ограничения только в бизнес-логике

**courses.service.ts:**
```typescript
if (existingCoursesCount >= 1) {
  throw new BadRequestException('MVP limit: only 1 course allowed');
}
```

**Для v1.0:** удалить эту проверку → всё работает!

### 3. Уникальные ссылки для каждого ученика

```typescript
@Column({ type: 'uuid', unique: true })
@Generated('uuid')
accessToken: string;
```

**URL:** `https://t.me/bot_name?start={accessToken}`

### 4. Telegram Share Picker

```typescript
Telegram.WebApp.openTelegramLink(
  `https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}`
);
```

### 5. Защита от "складчины" через Telegram ID (v2.1)

```typescript
// При добавлении ученика
const student = await this.streamStudentRepository.save({
  stream_id: streamId,
  telegram_id: telegramId, // фиксируем ID
  // ...
});

// При активации
if (student.telegram_id !== currentUserTelegramId) {
  throw new ForbiddenException('This link is not for you');
}
```

### 6. Mock-биллинг с реальной БД (v2.1)

```typescript
// В MVP работает на промокодах
const payment = await this.paymentRepository.save({
  user_id: userId,
  stream_id: streamId,
  amount: 0, // в MVP = 0
  payment_method: 'promo',
  status: 'paid'
});

// Для v1.0: подключаем Telegram Stars/Stripe
const payment = await this.paymentRepository.save({
  amount: stream.price_amount, // реальная цена
  payment_method: 'telegram_stars',
  payment_provider_id: result.transaction_id
});
```

---

## Готовность к v1.0

**Переход к v1.0 (после валидации MVP):**

1. **Снять ограничение "1 курс"** → удалить 4 строки в `courses.service.ts`
2. **Включить загрузку обложек** → активировать роут `/courses/:id/cover`
3. **Включить трекинг прогресса** → начать запись в `lesson_progress`
4. **Активировать уведомления при добавлении урока** → подключить триггер
5. **Включить soft-delete** → использовать `deletedAt` вместо hard delete
6. **Активировать templates** → UI для `notification_templates`
7. **Подключить реальные платежи** → интеграция Telegram Stars/Stripe (v2.1)
8. **Активировать генератор промокодов** → подключить UI к API (v2.1)
9. **Реальная аналитика платежей** → тянуть данные из `payments` (v2.1)

**Миграция данных НЕ требуется** - все уже в БД! ✅

---

## Структура проекта

### Backend Modules

```typescript
// backend/src/modules/

auth/
├── auth.module.ts
├── auth.service.ts
├── auth.controller.ts
├── guards/
│   └── telegram-auth.guard.ts
└── decorators/
    └── current-user.decorator.ts

users/
├── users.module.ts
├── users.service.ts
├── users.controller.ts
└── entities/
    └── user.entity.ts

courses/
├── courses.module.ts
├── courses.service.ts
├── courses.controller.ts
├── blocks.service.ts
├── blocks.controller.ts
├── lessons.service.ts
├── lessons.controller.ts
└── entities/
    ├── course.entity.ts
    ├── block.entity.ts
    └── lesson.entity.ts

streams/
├── streams.module.ts
├── streams.service.ts
├── streams.controller.ts
├── stream-students.service.ts
└── entities/
    ├── stream.entity.ts
    └── stream-student.entity.ts

payments/ (v2.1)
├── payments.module.ts
├── payments.service.ts
├── payments.controller.ts
└── entities/
    └── payment.entity.ts

promo-codes/ (v2.1)
├── promo-codes.module.ts
├── promo-codes.service.ts
├── promo-codes.controller.ts
└── entities/
    └── promo-code.entity.ts

notifications/
├── notifications.module.ts
├── notifications.service.ts
├── notifications.processor.ts (Bull worker)
└── entities/
    ├── notification.entity.ts
    └── notification-template.entity.ts

telegram-bot/
├── telegram-bot.module.ts
├── telegram-bot.service.ts
├── telegram-bot.gateway.ts
└── utils/
    └── telegram-auth.utils.ts
```

### Frontend Components

```typescript
// frontend/src/components/

creator/
├── CreatorDashboard.tsx
├── Navigation.tsx
├── courses/
│   ├── CoursesList.tsx
│   ├── CourseEditor.tsx
│   ├── BlocksList.tsx
│   ├── BlockEditor.tsx
│   ├── LessonEditor.tsx
│   ├── VideoUpload.tsx
│   ├── ExternalLink.tsx
│   ├── OnlineMeeting.tsx
│   └── DemoTranscriptionButton.tsx
└── streams/
    ├── StreamsList.tsx
    ├── StreamCreator.tsx
    ├── CourseSelector.tsx
    ├── NotificationSettings.tsx
    ├── PaymentSettings.tsx (v2.1)
    ├── SharePickerButton.tsx
    ├── StreamDetails.tsx
    ├── StudentsList.tsx
    ├── StudentCard.tsx (с кнопкой "💬 Написать", v2.1)
    ├── PaymentStatusBadge.tsx (v2.1)
    ├── BroadcastMessage.tsx
    ├── PaymentAnalytics.tsx (v2.1)
    ├── PromoCodesScreen.tsx (v2.1)
    └── StreamSettings.tsx

student/
├── StudentDashboard.tsx
├── PaymentScreen.tsx (v2.1)
├── PromoCodeInput.tsx (v2.1)
├── dashboard/
│   ├── CourseList.tsx
│   ├── CourseCard.tsx
│   └── CourseStub.tsx
├── course/
│   ├── CourseView.tsx
│   ├── BlocksList.tsx
│   └── LessonView.tsx
└── lesson/
    ├── VideoPlayer.tsx
    ├── ExternalLinkButton.tsx
    ├── OnlineMeetingButton.tsx
    └── DemoTranscription.tsx

shared/
├── LoadingSpinner.tsx
├── ErrorBoundary.tsx
├── Modal.tsx
└── Toast.tsx
```

---

## Переменные окружения

### Backend (.env)
```bash
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=telegram_course_platform

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_BOT_USERNAME=your_bot_username

# App
PORT=3000
NODE_ENV=development

# ngrok (для тестирования)
NGROK_URL=https://abc123.ngrok.io
FRONTEND_URL=https://def456.ngrok.io
```

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:3000/api
VITE_TELEGRAM_BOT_USERNAME=your_bot_username
```

---

## Docker Compose

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: telegram-course-db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: telegram_course_platform
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: telegram-course-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

---

## Заключение

Эта техническая декомпозиция MVP v2.1 предоставляет полный план разработки Telegram Course Platform с поддержкой mock-биллинга, промокодов, защиты от "складчины" и прямой связи с учениками через Telegram.

**Основные изменения v2.1:**
- ✅ Mock-биллинг с промокодами (полноценная БД)
- ✅ Экран оплаты для учеников
- ✅ Защита от "складчины" через Telegram ID
- ✅ Статусы оплаты (💳 Оплачено / ⏳ Не оплачено)
- ✅ Кнопка "💬 Написать" для связи с учениками
- ✅ Вкладка "💳 Оплаты [DEMO]" с аналитикой
- ✅ Экран генератора промокодов (UI-заглушка)

**Архитектура готова к масштабированию:**
- ✅ БД спроектирована для миллионов пользователей
- ✅ Уникальные ссылки для каждого ученика
- ✅ Индексы и оптимизация запросов
- ✅ Bull queues для асинхронных задач
- ✅ Полноценная БД для биллинга (готова к реальным платежам)

**Ограничения MVP:**
- Только на уровне бизнес-логики
- Техническая инфраструктура полноценная
- Переход к v1.0 без переписывания архитектуры

---

**Документ обновлен:** 20 ноября 2024  
**Версия:** v2.1  
**Основа:** PRD_Telegram_Course_Platform_MVP_v2.1.md
