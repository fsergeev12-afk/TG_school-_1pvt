// ============ User ============
export interface User {
  id: string;
  telegramId: number;
  telegramUsername?: string;
  firstName?: string;
  lastName?: string;
  role: 'student' | 'creator' | 'admin';
  createdAt: string;
}

// ============ Course ============
export interface Course {
  id: string;
  creatorId: string;
  title: string;
  description?: string;
  coverImageUrl?: string;
  isPublished: boolean;
  blocks: Block[];
  createdAt: string;
  updatedAt: string;
}

export interface Block {
  id: string;
  courseId: string;
  title: string;
  displayOrder: number;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  blockId: string;
  title: string;
  description?: string;
  videoType?: 'telegram' | 'external';
  videoTelegramFileId?: string;
  videoExternalUrl?: string;
  videoUrl?: string; // Alias for videoExternalUrl
  videoDuration?: number;
  displayOrder: number;
  materials: LessonMaterial[];
}

export interface LessonMaterial {
  id: string;
  lessonId: string;
  fileName: string;
  fileType: 'pdf' | 'doc';
  fileSizeBytes: number;
  telegramFileId: string;
}

// ============ Stream ============
export interface Stream {
  id: string;
  creatorId: string;
  courseId: string;
  name: string;
  description?: string;
  price: number;
  startsAt?: string;
  scheduleEnabled: boolean;
  sendWelcome: boolean;
  notifyOnLessonOpen: boolean;
  isActive: boolean;
  inviteToken: string; // Общий токен приглашения для потока
  course?: Course;
  students?: StreamStudent[];
  schedules?: LessonSchedule[];
  createdAt: string;
  // Computed stats for list view
  studentsCount?: number;
  activatedCount?: number;
  paidCount?: number;
}

export interface StreamStudent {
  id: string;
  streamId: string;
  userId?: string;
  telegramId: number;
  telegramUsername?: string;
  telegramFirstName?: string;
  telegramLastName?: string;
  // Aliases for convenience
  firstName?: string;
  lastName?: string;
  invitationStatus: 'invited' | 'activated';
  paymentStatus: 'unpaid' | 'paid';
  accessToken: string;
  inviteLink?: string;
  invitedAt: string;
  activatedAt?: string;
  paidAt?: string;
}

export interface LessonSchedule {
  id: string;
  lessonId: string;
  streamId: string;
  scheduledOpenAt: string;
  isOpened: boolean;
  notificationSent: boolean;
  lesson?: Lesson;
}

// ============ PromoCode ============
export interface PromoCode {
  id: string;
  streamId: string;
  code: string;
  type: 'free' | 'percent_discount' | 'fixed_discount';
  discountValue?: number;
  maxUsages?: number;
  usageCount: number;
  expiresAt?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

// ============ Payment ============
export interface Payment {
  id: string;
  studentId: string;
  streamId: string;
  amount: number;
  originalAmount: number;
  discountAmount: number;
  currency: string;
  promoCodeId?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  completedAt?: string;
  createdAt: string;
}

// ============ Chat ============
export interface Conversation {
  id: string;
  creatorId: string;
  studentId?: string;
  streamId?: string;
  telegramChatId: number;
  telegramUsername?: string;
  telegramFirstName?: string;
  telegramLastName?: string;
  lastMessageAt: string;
  unreadCount: number;
  messages?: Message[];
  student?: StreamStudent;
  stream?: Stream;
}

export interface Message {
  id: string;
  conversationId: string;
  senderType: 'creator' | 'student';
  text: string;
  telegramMessageId?: number;
  isRead: boolean;
  createdAt: string;
}

// ============ Notification ============
export interface Notification {
  id: string;
  studentId: string;
  streamId?: string;
  type: 'welcome' | 'lesson_opened' | 'broadcast' | 'creator_reply';
  title: string;
  message: string;
  status: 'pending' | 'sent' | 'failed';
  sentAt?: string;
  createdAt: string;
}

// ============ Stats ============
export interface PaymentStats {
  totalRevenue: number;
  totalPayments: number;
  completedPayments: number;
  pendingPayments: number;
  failedPayments: number;
  averagePayment: number;
}

export interface StudentStats {
  total: number;
  invited: number;
  activated: number;
  paid: number;
  unpaid: number;
}

// ============ API Responses ============
export interface ApiError {
  message: string;
  statusCode: number;
}

export interface UploadResult {
  fileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storageType: 'telegram' | 'local';
  url?: string;
}


