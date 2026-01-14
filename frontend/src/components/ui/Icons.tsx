/**
 * SVG Icons для Desert Sunset Theme
 * Замена эмодзи на иконки в едином стиле
 */

import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

// 📚 Проект/Курс
export const BookIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', size }) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/>
  </svg>
);

// 👥 Студенты/Потоки
export const UsersIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', size }) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
  </svg>
);

// 💬 Чат/Сообщения
export const ChatIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', size }) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
  </svg>
);

// ⚙️ Настройки
export const SettingsIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', size }) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
  </svg>
);

// 🏠 Главная/Дом
export const HomeIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', size }) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
  </svg>
);

// ✅ Галочка/Успех
export const CheckIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
  </svg>
);

// ⏳ Ожидание
export const ClockIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
  </svg>
);

// 📩 Письмо/Приглашение
export const MailIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
  </svg>
);

// 💳 Оплата/Карта
export const CreditCardIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
  </svg>
);

// 💰 Деньги/Цена
export const MoneyIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
  </svg>
);

// 📅 Календарь/Дата
export const CalendarIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
  </svg>
);

// 🎁 Промокод/Подарок
export const GiftIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"/>
  </svg>
);

// ← Назад
export const ArrowLeftIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
  </svg>
);

// → Вперёд
export const ArrowRightIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
  </svg>
);

// + Плюс
export const PlusIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
  </svg>
);

// 🔍 Поиск
export const SearchIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
  </svg>
);

// ✏️ Редактировать
export const EditIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
  </svg>
);

// 🗑️ Удалить
export const TrashIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
  </svg>
);

// 📋 Копировать
export const CopyIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
  </svg>
);

// 📱 Telegram
export const TelegramIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
  </svg>
);

// 🎯 Статистика/Цель
export const TargetIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
  </svg>
);

// 🔓 Открыто
export const UnlockIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"/>
  </svg>
);

// 🔒 Закрыто
export const LockIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
  </svg>
);

// 📄 Документ/Файл
export const DocumentIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
  </svg>
);

// 🎥 Видео
export const VideoIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
  </svg>
);

// 📎 Прикрепить/Файлы
export const PaperclipIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
  </svg>
);

// ℹ️ Информация
export const InfoIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
  </svg>
);

// ❓ Вопрос
export const QuestionIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
  </svg>
);

// 🎟️ Промокод/Билет
export const TicketIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/>
  </svg>
);

// 📢 Рассылка/Объявление
export const BroadcastIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/>
  </svg>
);

// 🔔 Уведомления
export const BellIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
  </svg>
);

// 🎲 Генерация/Случайность
export const DiceIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
  </svg>
);

// ▶️ Воспроизвести
export const PlayIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', size }) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
  </svg>
);

// 📥 Скачать
export const DownloadIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
  </svg>
);

// 🔗 Ссылка
export const LinkIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
  </svg>
);

// ... Меню (3 точки)
export const DotsIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
  </svg>
);

// 👤 Пользователь/Профиль
export const UserIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
  </svg>
);

// 📂 Папка
export const FolderIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
  </svg>
);

// ✕ Закрыть
export const CloseIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
  </svg>
);

// 📤 Загрузить/Поделиться
export const UploadIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
  </svg>
);

// 👁️ Просмотр
export const EyeIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
  </svg>
);

// ⚠️ Предупреждение
export const WarningIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
  </svg>
);

// 💡 Лампочка/Идея
export const LightbulbIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
  </svg>
);

// 📊 График/Статистика
export const ChartIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
  </svg>
);

// 🚀 Ракета/Запуск
export const RocketIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
  </svg>
);

// ✓✓ Прочитано (двойная галочка)
export const DoubleCheckIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size }) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 13l4 4L23 7" opacity="0.5"/>
  </svg>
);

// 🎨 Палитра иконок для статусов
export const StatusDot: React.FC<{ color: 'success' | 'warning' | 'error' | 'neutral'; className?: string }> = ({ 
  color, 
  className = 'w-2 h-2' 
}) => {
  const colors = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error: 'bg-rose-500',
    neutral: 'bg-gray-400',
  };
  
  return <span className={`${className} rounded-full ${colors[color]}`} />;
};

// Экспорт всех иконок
export const Icons = {
  Book: BookIcon,
  Users: UsersIcon,
  Chat: ChatIcon,
  Settings: SettingsIcon,
  Home: HomeIcon,
  Check: CheckIcon,
  Clock: ClockIcon,
  Mail: MailIcon,
  CreditCard: CreditCardIcon,
  Money: MoneyIcon,
  Calendar: CalendarIcon,
  Gift: GiftIcon,
  ArrowLeft: ArrowLeftIcon,
  ArrowRight: ArrowRightIcon,
  Plus: PlusIcon,
  Search: SearchIcon,
  Edit: EditIcon,
  Trash: TrashIcon,
  Copy: CopyIcon,
  Telegram: TelegramIcon,
  Target: TargetIcon,
  Unlock: UnlockIcon,
  Lock: LockIcon,
  Document: DocumentIcon,
  Video: VideoIcon,
  Paperclip: PaperclipIcon,
  Info: InfoIcon,
  Question: QuestionIcon,
  Ticket: TicketIcon,
  Broadcast: BroadcastIcon,
  Bell: BellIcon,
  Dice: DiceIcon,
  Play: PlayIcon,
  Download: DownloadIcon,
  Link: LinkIcon,
  Dots: DotsIcon,
  User: UserIcon,
  DoubleCheck: DoubleCheckIcon,
  Folder: FolderIcon,
  Close: CloseIcon,
  Upload: UploadIcon,
  Eye: EyeIcon,
  Warning: WarningIcon,
  Lightbulb: LightbulbIcon,
  Chart: ChartIcon,
  Rocket: RocketIcon,
  StatusDot,
};

