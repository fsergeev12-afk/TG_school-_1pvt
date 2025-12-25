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

// Create Query Client for API requests
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
  const { setUser, user, isLoading } = useAuthStore();

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
      // Проверка URL параметра для форсирования роли (для тестирования)
      const urlParams = new URLSearchParams(window.location.search);
      const forceRole = urlParams.get('role'); // ?role=student или ?role=creator

      // Если есть реальные данные Telegram - пробуем авторизоваться
      if (webApp?.initData && !forceRole) {
        try {
          const { data } = await apiClient.get('/auth/me');
          setUser(data);
          return;
        } catch (error) {
          console.error('Auth error:', error);
        }
      }

      // Мок пользователь для разработки/тестирования
      const role = forceRole || 'student';
      setUser({
        id: role === 'creator' ? 'dev-creator-id' : 'dev-student-id',
        telegramId: tgUser?.id || 123456789,
        firstName: tgUser?.first_name || 'Тестовый',
        lastName: tgUser?.last_name || (role === 'creator' ? 'Создатель' : 'Ученик'),
        telegramUsername: tgUser?.username || (role === 'creator' ? 'test_creator' : 'test_student'),
        role: role as 'creator' | 'student' | 'admin',
        createdAt: new Date().toISOString(),
      });
    };

    if (webApp) {
      authenticate();
    }
  }, [webApp, tgUser, setUser]);

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
