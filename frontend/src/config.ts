/**
 * Конфигурация приложения
 */

// Telegram Bot
export const TELEGRAM_BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'Bllocklyyy_bot';

// Telegram Mini App short name (из BotFather)
export const TELEGRAM_APP_SHORT_NAME = import.meta.env.VITE_TELEGRAM_APP_SHORT_NAME || 'Amber';

// API
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://tg-school-1pvt-backend-production.up.railway.app/api';

/**
 * Генерация Telegram Direct Link для Mini App
 * Формат: https://t.me/BOT/APP?startapp=TOKEN
 * Сразу открывает Mini App без перехода в чат бота!
 */
export function generateInviteLink(token: string): string {
  return `https://t.me/${TELEGRAM_BOT_USERNAME}/${TELEGRAM_APP_SHORT_NAME}?startapp=${token}`;
}

