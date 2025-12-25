/**
 * Конфигурация приложения
 */

// Telegram Bot
export const TELEGRAM_BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'Bllocklyyy_bot';

// API
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://tg-school-1pvt-backend-production.up.railway.app/api';

/**
 * Генерация Telegram deep link для приглашения
 */
export function generateInviteLink(token: string): string {
  return `https://t.me/${TELEGRAM_BOT_USERNAME}?start=${token}`;
}

