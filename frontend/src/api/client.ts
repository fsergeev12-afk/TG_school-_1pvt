import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Интерцептор для добавления Telegram initData в заголовки
apiClient.interceptors.request.use((config) => {
  const tg = window.Telegram?.WebApp;
  if (tg?.initData) {
    config.headers['x-telegram-init-data'] = tg.initData;
  }
  return config;
});

// Интерцептор для обработки ошибок
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);



