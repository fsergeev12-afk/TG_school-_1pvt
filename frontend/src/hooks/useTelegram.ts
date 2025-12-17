import { useEffect, useState } from 'react';

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
    start_param?: string;
  };
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
  };
  ready: () => void;
  expand: () => void;
  close: () => void;
  setHeaderColor: (color: string) => void;
  openTelegramLink: (url: string) => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

export const useTelegram = () => {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      // Реальный Telegram WebApp
      tg.ready();
      tg.expand();
      setWebApp(tg);
      setUser(tg.initDataUnsafe?.user || null);
    } else {
      // Мок для разработки в браузере
      const mockWebApp: TelegramWebApp = {
        initData: '',
        initDataUnsafe: {
          user: {
            id: 123456789,
            first_name: 'Тестовый',
            last_name: 'Пользователь',
            username: 'test_user',
            language_code: 'ru',
          },
          start_param: undefined,
        },
        themeParams: {
          bg_color: '#ffffff',
          text_color: '#000000',
          hint_color: '#999999',
          link_color: '#2481cc',
          button_color: '#2481cc',
          button_text_color: '#ffffff',
        },
        ready: () => console.log('[DEV] Telegram WebApp ready'),
        expand: () => console.log('[DEV] Telegram WebApp expand'),
        close: () => console.log('[DEV] Telegram WebApp close'),
        setHeaderColor: (color: string) => console.log('[DEV] Set header color:', color),
        openTelegramLink: (url: string) => {
          console.log('[DEV] Open Telegram link:', url);
          window.open(url, '_blank');
        },
      };
      
      // Небольшая задержка для имитации загрузки
      setTimeout(() => {
        setWebApp(mockWebApp);
        setUser(mockWebApp.initDataUnsafe.user);
      }, 500);
    }
  }, []);

  return {
    webApp,
    user,
    startParam: webApp?.initDataUnsafe?.start_param,
  };
};



