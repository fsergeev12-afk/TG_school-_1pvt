/**
 * Desert Sunset Theme
 * Modula v4.0 — Alto's Odyssey Palette
 */

export const desertSunset = {
  // Градиент фона (сверху вниз)
  background: {
    gradient: 'linear-gradient(180deg, #C9B8D4 0%, #D4C4D4 40%, #E8DCD8 100%)',
    lavender: '#C9B8D4',
    powder: '#D4C4D4',
    sand: '#E8DCD8',
  },

  // Основные цвета текста
  text: {
    dark: '#3D2E4A',      // Заголовки, основной текст
    medium: '#5B4A6A',    // Подзаголовки
    secondary: '#8B7A9A', // Описания, hints
    muted: '#A090B0',     // Неактивные элементы
  },

  // Фиолетовые оттенки
  purple: {
    main: '#6B5A7A',      // Активные элементы, навигация
    light: '#B8A8C8',     // Подсветка
  },

  // Терракотовые оттенки (CTA)
  terracotta: {
    main: '#D4956A',      // Главные кнопки
    dark: '#C4855A',      // Градиент кнопок
    light: '#B87A4A',     // Hover состояния
  },

  // Градиенты для кнопок
  gradients: {
    cta: 'linear-gradient(135deg, #D4956A, #C4855A)',
    nav: 'linear-gradient(135deg, #6B5A7A, #5B4A6A)',
    navGradient: 'linear-gradient(to top, #E8DCD8 60%, transparent 100%)',
  },

  // Градиенты для аватарок
  avatar: {
    neutral: 'linear-gradient(145deg, #E8DCD8, #D4C4D4)',
    accent: 'linear-gradient(145deg, #C9B8D4, #B8A8C8)',
    dark: 'linear-gradient(145deg, #5B4A6A, #4A3D5A)',
  },

  // Карточки
  card: {
    active: 'rgba(255, 255, 255, 0.8)',
    normal: 'rgba(255, 255, 255, 0.6)',
    inactive: 'rgba(255, 255, 255, 0.4)',
    line: 'linear-gradient(90deg, #C9B8D4, #D4956A, #C9B8D4)',
  },

  // Семантические цвета
  semantic: {
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
  },

  // Тени
  shadows: {
    soft: '0 2px 8px rgba(107, 91, 122, 0.1)',
    card: '0 4px 20px rgba(107, 91, 122, 0.15)',
  },
} as const;

export type DesertSunsetTheme = typeof desertSunset;

