# 📋 План работ по доработке проекта до MVP v3.0

**Дата создания:** 17 декабря 2024  
**Статус:** В работе  
**Источник требований:** PRD_Telegram_Course_Platform_MVP_v3_0.md, TASK_CHECKLIST_V3.md

---

## 🎯 Цель

Довести проект до полного соответствия требованиям MVP v3.0, включая:
- Обновление существующих компонентов
- Создание недостающих модулей
- Полноценный frontend для создателя и ученика
- Интеграции (Telegram Bot, биллинг, расписание)

---

## 📊 Фазы работ

| Фаза | Название | Оценка времени | Зависимости |
|------|----------|----------------|-------------|
| 1 | Backend: Исправление entities | 2-3 часа | - |
| 2 | Backend: Новые entities v3.0 | 1-2 часа | Фаза 1 |
| 3 | Backend: Модуль Courses | 3-4 часа | Фаза 2 |
| 4 | Backend: Модуль Streams | 3-4 часа | Фаза 3 |
| 5 | Backend: Модуль PromoCode | 2-3 часа | Фаза 4 |
| 6 | Backend: Модуль Payments | 2-3 часа | Фаза 5 |
| 7 | Backend: Модуль Chats | 3-4 часа | Фаза 4 |
| 8 | Backend: Расписание + Cron | 2-3 часа | Фаза 4 |
| 9 | Backend: Загрузка файлов | 2-3 часа | Фаза 3 |
| 10 | Frontend: Общая структура + навигация | 2-3 часа | Фаза 6 |
| 11 | Frontend: Интерфейс создателя | 6-8 часов | Фаза 10 |
| 12 | Frontend: Интерфейс ученика | 4-6 часов | Фаза 10 |
| 13 | Интеграция и тестирование | 3-4 часа | Все фазы |

---

## 🔧 ФАЗА 1: Исправление существующих entities

### 1.1. Course entity
**Файл:** `backend/src/modules/courses/entities/course.entity.ts`

**Изменения:**
- [ ] Переименовать `coverUrl` → `coverImageUrl` (camelCase для TypeORM)
- [ ] Убедиться что `description` не nullable для v3.0
- [ ] Добавить связь с `streams` (OneToMany)

```typescript
// Было:
@Column({ type: 'varchar', length: 1000, nullable: true })
coverUrl: string;

// Станет:
@Column({ type: 'text', nullable: true })
coverImageUrl: string; // JPG/PNG до 5MB, хранится в CDN/S3
```

---

### 1.2. Lesson entity
**Файл:** `backend/src/modules/courses/entities/lesson.entity.ts`

**КРИТИЧЕСКИЕ изменения:**

**Удалить (legacy v2.1):**
- [ ] `contentType` — заменяется на `videoType`
- [ ] `videoFileId` — заменяется на `videoTelegramFileId`
- [ ] `hasDemoTranscription` — AI-транскрибация удалена в v3.0
- [ ] `transcriptionText` — удалено в v3.0
- [ ] `meetingUrl`, `meetingStartAt` — online_meeting удалён в v3.0

**Добавить (v3.0):**
- [ ] `videoType`: 'telegram' | 'external' | null
- [ ] `videoTelegramFileId`: string — file_id из Telegram (до 50MB)
- [ ] `videoExternalUrl`: string — YouTube, Vimeo, и др.

```typescript
// Новая структура v3.0:
@Column({ type: 'varchar', length: 20, nullable: true })
videoType: string; // 'telegram' | 'external' | null

@Column({ type: 'varchar', length: 255, nullable: true })
videoTelegramFileId: string; // Telegram file_id

@Column({ type: 'text', nullable: true })
videoExternalUrl: string; // YouTube, Vimeo URL
```

---

### 1.3. Block entity
**Файл:** `backend/src/modules/courses/entities/block.entity.ts`

**Изменения:**
- [ ] Добавить `description` если отсутствует

---

### 1.4. Stream entity
**Файл:** `backend/src/modules/streams/entities/stream.entity.ts`

**Изменения:**
- [ ] Добавить `price`: number (цена в рублях, не копейках)
- [ ] Добавить `scheduleEnabled`: boolean
- [ ] Упростить поля уведомлений (убрать legacy)

```typescript
// Добавить:
@Column({ type: 'int', default: 0 })
price: number; // Цена курса в рублях

@Column({ type: 'boolean', default: false })
scheduleEnabled: boolean; // Включить расписание уроков
```

---

### 1.5. StreamStudent entity
**Файл:** `backend/src/modules/streams/entities/stream-student.entity.ts`

**Изменения:**
- [ ] `status` → `invitationStatus` (семантика v3.0)
- [ ] `paymentStatus` — изменить значения: 'unpaid' | 'paid' (без 'not_required')
- [ ] Добавить `paidAt`: Date

```typescript
// Было:
@Column({ type: 'varchar', length: 50, default: 'invited' })
status: string; // 'invited' | 'activated'

@Column({ type: 'varchar', length: 50, default: 'not_required' })
paymentStatus: string; // 'not_required' | 'pending' | 'paid'

// Станет:
@Column({ type: 'varchar', length: 20, default: 'invited' })
invitationStatus: string; // 'invited' | 'activated'

@Column({ type: 'varchar', length: 20, default: 'unpaid' })
paymentStatus: string; // 'unpaid' | 'paid'

@Column({ type: 'datetime', nullable: true })
paidAt: Date;
```

---

### 1.6. PromoCode entity
**Файл:** `backend/src/modules/promo-codes/entities/promo-code.entity.ts`

**КРИТИЧЕСКИЕ изменения:**
- [ ] Добавить `streamId` — привязка к потоку (по PRD v3.0)
- [ ] Изменить `type`: 'free' | 'percent_discount' | 'fixed_discount'
- [ ] `discountValue` — теперь обязательно для percent/fixed

```typescript
// Добавить:
@Column({ type: 'uuid' })
@Index()
streamId: string; // Привязка к потоку

@ManyToOne(() => Stream, { onDelete: 'CASCADE' })
@JoinColumn({ name: 'streamId' })
stream: Stream;

// Изменить type:
@Column({ type: 'varchar', length: 20 })
type: string; // 'free' | 'percent_discount' | 'fixed_discount'
```

---

### 1.7. Payment entity
**Файл:** `backend/src/modules/payments/entities/payment.entity.ts`

**Изменения:**
- [ ] Проверить структуру под v3.0
- [ ] Добавить связь с `promoCode` если нет
- [ ] Убедиться что есть поле для внешнего провайдера

---

## 🆕 ФАЗА 2: Новые entities v3.0

### 2.1. Conversation entity (NEW)
**Файл:** `backend/src/modules/chats/entities/conversation.entity.ts`

```typescript
@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  creatorId: string; // Создатель курса

  @Column({ type: 'uuid', nullable: true })
  studentId: string; // Может быть null для "рандомных"

  @Column({ type: 'uuid', nullable: true })
  streamId: string; // Может быть null

  @Column({ type: 'bigint' })
  @Index()
  telegramChatId: number; // Telegram chat_id ученика

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  lastMessageAt: Date;

  @Column({ type: 'int', default: 0 })
  unreadCount: number;

  @CreateDateColumn()
  createdAt: Date;
}
```

---

### 2.2. Message entity (NEW)
**Файл:** `backend/src/modules/chats/entities/message.entity.ts`

```typescript
@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  conversationId: string;

  @Column({ type: 'varchar', length: 20 })
  senderType: string; // 'creator' | 'student'

  @Column({ type: 'text' })
  text: string;

  @Column({ type: 'bigint', nullable: true })
  telegramMessageId: number; // ID сообщения в Telegram

  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
```

---

### 2.3. LessonSchedule entity (NEW)
**Файл:** `backend/src/modules/streams/entities/lesson-schedule.entity.ts`

```typescript
@Entity('lesson_schedules')
@Unique(['lessonId', 'streamId'])
export class LessonSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  lessonId: string;

  @Column({ type: 'uuid' })
  @Index()
  streamId: string;

  @Column({ type: 'datetime' })
  scheduledOpenAt: Date;

  @Column({ type: 'boolean', default: false })
  isOpened: boolean;

  @Column({ type: 'boolean', default: false })
  notificationSent: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

---

### 2.4. LessonMaterial entity (NEW)
**Файл:** `backend/src/modules/courses/entities/lesson-material.entity.ts`

```typescript
@Entity('lesson_materials')
export class LessonMaterial {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  lessonId: string;

  @Column({ type: 'varchar', length: 255 })
  fileName: string;

  @Column({ type: 'varchar', length: 10 })
  fileType: string; // 'pdf' | 'doc'

  @Column({ type: 'int' })
  fileSizeBytes: number;

  @Column({ type: 'varchar', length: 255 })
  telegramFileId: string; // Telegram file_id

  @CreateDateColumn()
  createdAt: Date;
}
```

---

### 2.5. PromoCodeUsage entity (NEW)
**Файл:** `backend/src/modules/promo-codes/entities/promo-code-usage.entity.ts`

```typescript
@Entity('promo_code_usages')
@Unique(['promoCodeId', 'studentId'])
export class PromoCodeUsage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  promoCodeId: string;

  @Column({ type: 'uuid' })
  studentId: string; // stream_student.id

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  usedAt: Date;
}
```

---

## 🔨 ФАЗА 3: Модуль Courses (полноценный)

### 3.1. Структура модуля
```
backend/src/modules/courses/
├── courses.module.ts
├── courses.service.ts
├── courses.controller.ts
├── blocks.service.ts
├── blocks.controller.ts
├── lessons.service.ts
├── lessons.controller.ts
├── dto/
│   ├── create-course.dto.ts
│   ├── update-course.dto.ts
│   ├── create-block.dto.ts
│   ├── update-block.dto.ts
│   ├── create-lesson.dto.ts
│   ├── update-lesson.dto.ts
│   └── reorder.dto.ts
└── entities/
    ├── course.entity.ts ✅
    ├── block.entity.ts ✅
    ├── lesson.entity.ts ✅
    └── lesson-material.entity.ts (NEW)
```

### 3.2. API Endpoints
```
POST   /api/courses                    - Создать курс
GET    /api/courses                    - Список курсов создателя
GET    /api/courses/:id                - Получить курс
PATCH  /api/courses/:id                - Обновить курс
DELETE /api/courses/:id                - Удалить курс
POST   /api/courses/:id/cover          - Загрузить обложку

POST   /api/courses/:courseId/blocks   - Создать блок
PATCH  /api/blocks/:id                 - Обновить блок
DELETE /api/blocks/:id                 - Удалить блок
PATCH  /api/blocks/reorder             - Изменить порядок блоков

POST   /api/blocks/:blockId/lessons    - Создать урок
PATCH  /api/lessons/:id                - Обновить урок
DELETE /api/lessons/:id                - Удалить урок
PATCH  /api/lessons/reorder            - Изменить порядок уроков
POST   /api/lessons/:id/video          - Загрузить видео
POST   /api/lessons/:id/materials      - Загрузить материалы
DELETE /api/lessons/:id/materials/:materialId - Удалить материал
```

### 3.3. Ключевая логика
- [ ] Мультикурсовость (без ограничения "1 курс")
- [ ] Drag-and-drop: изменение displayOrder
- [ ] Загрузка обложки → CDN/S3 → сохранение URL
- [ ] Загрузка видео → Telegram Bot API → сохранение file_id
- [ ] Загрузка материалов → Telegram Bot API → сохранение file_id

---

## 📚 ФАЗА 4: Модуль Streams

### 4.1. Структура модуля
```
backend/src/modules/streams/
├── streams.module.ts
├── streams.service.ts
├── streams.controller.ts
├── stream-students.service.ts
├── lesson-schedules.service.ts
├── dto/
│   ├── create-stream.dto.ts
│   ├── update-stream.dto.ts
│   ├── add-students.dto.ts
│   └── set-schedule.dto.ts
└── entities/
    ├── stream.entity.ts ✅
    ├── stream-student.entity.ts ✅
    └── lesson-schedule.entity.ts (NEW)
```

### 4.2. API Endpoints
```
POST   /api/streams                    - Создать поток
GET    /api/streams                    - Список потоков
GET    /api/streams/:id                - Получить поток
PATCH  /api/streams/:id                - Обновить поток
DELETE /api/streams/:id                - Удалить поток

POST   /api/streams/:id/students       - Добавить учеников
GET    /api/streams/:id/students       - Список учеников
DELETE /api/streams/:id/students/:studentId - Удалить ученика

POST   /api/streams/:id/schedule       - Установить расписание
GET    /api/streams/:id/schedule       - Получить расписание

POST   /api/streams/:id/broadcast      - Рассылка всем ученикам
```

### 4.3. Ключевая логика
- [ ] Создание потока с привязкой к курсу
- [ ] 4 шага мастера: курс → расписание → уведомления → название
- [ ] Расписание по урокам (lesson_schedules)
- [ ] Статусы учеников: invited → activated, unpaid → paid
- [ ] Share Picker интеграция (через фронт)

---

## 🎟️ ФАЗА 5: Модуль PromoCode

### 5.1. Структура
```
backend/src/modules/promo-codes/
├── promo-codes.module.ts
├── promo-codes.service.ts
├── promo-codes.controller.ts
├── dto/
│   ├── create-promo-code.dto.ts
│   ├── validate-promo-code.dto.ts
│   └── apply-promo-code.dto.ts
└── entities/
    ├── promo-code.entity.ts ✅
    └── promo-code-usage.entity.ts (NEW)
```

### 5.2. API Endpoints
```
POST   /api/streams/:streamId/promo-codes      - Создать промокод
GET    /api/streams/:streamId/promo-codes      - Список промокодов
PATCH  /api/promo-codes/:id                    - Обновить промокод
DELETE /api/promo-codes/:id                    - Удалить промокод

POST   /api/promo-codes/validate               - Валидация промокода
POST   /api/promo-codes/apply                  - Применить промокод
```

### 5.3. Ключевая логика
- [ ] 3 типа: free, percent_discount, fixed_discount
- [ ] Валидация: срок действия, лимит использований, повторное использование
- [ ] При type='free' → автоматически payment_status='paid'
- [ ] Учёт использований в promo_code_usages

---

## 💳 ФАЗА 6: Модуль Payments

### 6.1. Структура
```
backend/src/modules/payments/
├── payments.module.ts
├── payments.service.ts
├── payments.controller.ts
├── dto/
│   ├── create-payment-link.dto.ts
│   └── payment-webhook.dto.ts
└── entities/
    └── payment.entity.ts ✅
```

### 6.2. API Endpoints
```
POST   /api/payments/create-link       - Создать платёжную ссылку
GET    /api/payments/status/:id        - Статус платежа
POST   /api/payments/webhook           - Webhook от провайдера (заглушка)

GET    /api/streams/:id/analytics      - Аналитика платежей потока
```

### 6.3. Ключевая логика
- [ ] Генерация внешней ссылки (провайдер TBD, вероятно ЮKassa)
- [ ] Обработка callback после оплаты
- [ ] Webhook от провайдера (заглушка до выбора)
- [ ] Аналитика: переходы, конверсия, выручка

---

## 💬 ФАЗА 7: Модуль Chats (NEW v3.0)

### 7.1. Структура
```
backend/src/modules/chats/
├── chats.module.ts
├── chats.service.ts
├── chats.controller.ts
├── chats.gateway.ts (WebSocket опционально)
├── dto/
│   ├── send-message.dto.ts
│   └── mark-read.dto.ts
└── entities/
    ├── conversation.entity.ts (NEW)
    └── message.entity.ts (NEW)
```

### 7.2. API Endpoints
```
GET    /api/chats                      - Список диалогов
GET    /api/chats/:conversationId      - Получить диалог с сообщениями
POST   /api/chats/:conversationId/send - Отправить сообщение
PATCH  /api/chats/:conversationId/read - Пометить прочитанным
GET    /api/chats/unread-count         - Количество непрочитанных
```

### 7.3. Telegram Bot интеграция
- [ ] Webhook: POST /api/telegram/webhook — получение сообщений
- [ ] Сохранение в conversations/messages
- [ ] Обновление unread_count
- [ ] Ответ создателя → Bot API sendMessage

---

## ⏰ ФАЗА 8: Расписание + Cron

### 8.1. Cron Service
**Файл:** `backend/src/modules/scheduler/scheduler.service.ts`

```typescript
@Injectable()
export class SchedulerService {
  @Cron('*/5 * * * *') // каждые 5 минут
  async checkScheduledLessons() {
    // 1. Найти lesson_schedules где scheduled_open_at <= now AND is_opened = false
    // 2. Обновить is_opened = true
    // 3. Отправить уведомления ученикам через Bot API
    // 4. Установить notification_sent = true
  }
}
```

### 8.2. Уведомления
- [ ] Шаблон: "📚 Новый урок доступен! Курс: {name}, Блок: {name}, Урок: {name}"
- [ ] Отправка только оплатившим (payment_status = 'paid')
- [ ] Inline кнопка "Открыть урок"

---

## 📁 ФАЗА 9: Загрузка файлов

### 9.1. File Upload Service
**Файл:** `backend/src/modules/files/files.service.ts`

```typescript
@Injectable()
export class FilesService {
  // Загрузка обложки курса → CDN/S3
  async uploadCoverImage(file: Express.Multer.File): Promise<string>
  
  // Загрузка видео → Telegram Bot API
  async uploadVideoToTelegram(file: Express.Multer.File): Promise<string>
  
  // Загрузка материалов → Telegram Bot API
  async uploadMaterialToTelegram(file: Express.Multer.File): Promise<string>
}
```

### 9.2. Лимиты
- Обложки: JPG/PNG, до 5MB
- Видео: MP4/MOV/AVI, до 50MB
- Материалы: PDF/DOC, до 50MB

---

## 🎨 ФАЗА 10: Frontend — Общая структура

### 10.1. Структура папок
```
frontend/src/
├── components/
│   ├── shared/
│   │   ├── BottomNavigation.tsx
│   │   ├── LoadingScreen.tsx
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   └── FileUpload.tsx
│   ├── creator/
│   │   ├── courses/
│   │   ├── streams/
│   │   ├── chats/
│   │   └── settings/
│   └── student/
│       ├── dashboard/
│       ├── course/
│       ├── lesson/
│       └── payment/
├── pages/
│   ├── creator/
│   │   ├── CreatorLayout.tsx
│   │   ├── CoursesPage.tsx
│   │   ├── StreamsPage.tsx
│   │   ├── ChatsPage.tsx
│   │   └── SettingsPage.tsx
│   └── student/
│       ├── StudentLayout.tsx
│       ├── DashboardPage.tsx
│       ├── CoursePage.tsx
│       ├── LessonPage.tsx
│       └── PaymentPage.tsx
├── hooks/
│   ├── useTelegram.ts ✅
│   ├── useAuth.ts
│   ├── useCourses.ts
│   ├── useStreams.ts
│   └── useChats.ts
├── api/
│   ├── client.ts ✅
│   ├── courses.ts
│   ├── streams.ts
│   ├── chats.ts
│   └── payments.ts
└── App.tsx
```

### 10.2. Bottom Navigation
```typescript
// 4 вкладки для создателя:
// 📚 Курсы | 📊 Потоки | 💬 Чаты | ⚙️ Настройки
```

### 10.3. Роутинг
```typescript
// Creator routes:
/creator/courses
/creator/courses/:id/edit
/creator/streams
/creator/streams/:id
/creator/streams/:id/promo-codes
/creator/chats
/creator/chats/:conversationId
/creator/settings

// Student routes:
/student/dashboard
/student/course/:streamId
/student/lesson/:lessonId
/student/payment/:streamId
```

---

## 👨‍🏫 ФАЗА 11: Frontend — Интерфейс создателя

### 11.1. Вкладка "Курсы"
- [ ] Список курсов с обложками
- [ ] Создание курса (2 шага: инфо + структура)
- [ ] Редактирование курса
- [ ] Drag-and-drop блоков/уроков
- [ ] Загрузка обложки
- [ ] Модалка создания блока
- [ ] Модалка создания урока (гибридное видео)
- [ ] Загрузка материалов к уроку

### 11.2. Вкладка "Потоки"
- [ ] Список потоков
- [ ] Создание потока (4 шага)
- [ ] Детальная страница потока:
  - [ ] Вкладка "Ученики" (статусы, кнопки)
  - [ ] Вкладка "Рассылка"
  - [ ] Вкладка "Оплаты" (статистика)
  - [ ] Вкладка "Настройки"
- [ ] Share Picker для приглашения

### 11.3. Страница промокодов
- [ ] Список промокодов потока
- [ ] Создание промокода (3 типа)
- [ ] Редактирование/удаление
- [ ] Статистика использований

### 11.4. Вкладка "Чаты"
- [ ] Список диалогов
- [ ] Фильтр по потокам
- [ ] Индикаторы непрочитанных (🔴)
- [ ] Статусы учеников
- [ ] Экран диалога
- [ ] Отправка сообщений

---

## 🎓 ФАЗА 12: Frontend — Интерфейс ученика

### 12.1. Dashboard
- [ ] Приветствие
- [ ] Карточка курса с обложкой
- [ ] Статус доступа
- [ ] Кнопка "Перейти к курсу"

### 12.2. Страница курса
- [ ] Список блоков (accordion)
- [ ] Список уроков
- [ ] Статусы: доступен / заблокирован по оплате / заблокирован по дате
- [ ] Кнопка "Задать вопрос"

### 12.3. Страница урока
- [ ] Видео (embedded или внешняя ссылка)
- [ ] Описание урока
- [ ] Список материалов
- [ ] Навигация (пред/след)
- [ ] Кнопка "Задать вопрос"

### 12.4. Экран оплаты
- [ ] Карточка курса
- [ ] Цена
- [ ] Кнопка "Оплатить" (активная!)
- [ ] Поле промокода + "Применить"
- [ ] Модалка успеха/ошибки

---

## 🧪 ФАЗА 13: Интеграция и тестирование

### 13.1. E2E тестирование
- [ ] Создатель создаёт курс с блоками/уроками
- [ ] Создатель создаёт поток с расписанием
- [ ] Создатель добавляет учеников
- [ ] Ученик переходит по ссылке
- [ ] Ученик видит экран оплаты
- [ ] Ученик применяет промокод
- [ ] Ученик получает доступ
- [ ] Создатель видит чаты
- [ ] Создатель отвечает ученику

### 13.2. Проверка интеграций
- [ ] Telegram Bot webhook
- [ ] Bot API отправка сообщений
- [ ] Cron расписания
- [ ] Загрузка файлов

### 13.3. Документация
- [ ] Обновить README.md
- [ ] Обновить QUICK_START.md
- [ ] API документация (Swagger)

---

## 📅 Порядок выполнения

```
1. ФАЗА 1 → Исправление entities (БАЗА)
2. ФАЗА 2 → Новые entities (БАЗА)
3. ФАЗА 3 → Модуль Courses
4. ФАЗА 4 → Модуль Streams
5. ФАЗА 5 → Модуль PromoCode
6. ФАЗА 6 → Модуль Payments
7. ФАЗА 7 → Модуль Chats
8. ФАЗА 8 → Расписание + Cron
9. ФАЗА 9 → Загрузка файлов
10. ФАЗА 10 → Frontend структура
11. ФАЗА 11 → Frontend создатель
12. ФАЗА 12 → Frontend ученик
13. ФАЗА 13 → Тестирование
```

---

## ✅ Контрольные точки

| Точка | Критерий готовности |
|-------|---------------------|
| После Фазы 2 | Все entities созданы, БД готова |
| После Фазы 6 | Backend API полностью готов |
| После Фазы 9 | Все интеграции работают |
| После Фазы 12 | Frontend полностью готов |
| После Фазы 13 | MVP v3.0 готов к деплою |

---

**Готов начать с Фазы 1? 🚀**

