import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTelegram } from './hooks/useTelegram';
import { useEffect } from 'react';
import { useAuthStore } from './store';
import { apiClient } from './api/client';

// Layouts
import CreatorLayout from './pages/creator/CreatorLayout';
import StudentLayout from './pages/student/StudentLayout';

// Pages
import LoadingScreen from './components/shared/LoadingScreen';

// Create Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000,
    },
  },
});

function AppContent() {
  const { webApp, user: tgUser } = useTelegram();
  const { setUser, setLoading, user, isLoading } = useAuthStore();

  // Отладка
  console.log('[App] webApp:', !!webApp, 'tgUser:', tgUser, 'user:', user, 'isLoading:', isLoading);

  useEffect(() => {
    if (webApp) {
      // Применяем цвета Telegram темы
      const root = document.documentElement;
      root.style.setProperty('--tg-theme-bg-color', webApp.themeParams.bg_color || '#ffffff');
      root.style.setProperty('--tg-theme-text-color', webApp.themeParams.text_color || '#000000');
      root.style.setProperty('--tg-theme-hint-color', webApp.themeParams.hint_color || '#999999');
      root.style.setProperty('--tg-theme-link-color', webApp.themeParams.link_color || '#2481cc');
      root.style.setProperty('--tg-theme-button-color', webApp.themeParams.button_color || '#2481cc');
      root.style.setProperty('--tg-theme-button-text-color', webApp.themeParams.button_text_color || '#ffffff');
      root.style.setProperty('--tg-theme-secondary-bg-color', webApp.themeParams.secondary_bg_color || '#f0f0f0');

      // Расширяем на весь экран
      webApp.expand();
      webApp.ready();
    }
  }, [webApp]);

  // Аутентификация
  useEffect(() => {
    const authenticate = async () => {
      if (!webApp?.initData) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await apiClient.get('/auth/me');
        setUser(data);
      } catch (error) {
        console.error('Auth error:', error);
        // Если нет пользователя — он будет создан при первом запросе
        if (tgUser) {
          setUser({
            id: '',
            telegramId: tgUser.id,
            firstName: tgUser.first_name,
            lastName: tgUser.last_name,
            telegramUsername: tgUser.username,
            role: 'student',
            createdAt: new Date().toISOString(),
          });
        } else {
          setUser(null);
        }
      }
    };

    authenticate();
  }, [webApp, tgUser, setUser, setLoading]);

  if (!webApp) {
    return <LoadingScreen message="Открывайте приложение через Telegram" />;
  }

  if (isLoading) {
    return <LoadingScreen message="Загрузка..." />;
  }

  // Определяем начальный маршрут по роли
  const getDefaultRoute = () => {
    if (user?.role === 'creator' || user?.role === 'admin') {
      return '/creator';
    }
    return '/student';
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Creator routes */}
        <Route path="/creator/*" element={<CreatorLayout />} />
        
        {/* Student routes */}
        <Route path="/student/*" element={<StudentLayout />} />
        
        {/* Default redirect */}
        <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
        <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
