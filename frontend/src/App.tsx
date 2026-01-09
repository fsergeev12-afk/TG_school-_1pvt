import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTelegram } from './hooks/useTelegram';
import { useEffect, useState } from 'react';
import { useAuthStore } from './store';
import { apiClient } from './api/client';

// Layouts
import CreatorLayout from './pages/creator/CreatorLayout';
import StudentLayout from './pages/student/StudentLayout';
import PaymentPage from './pages/student/PaymentPage';

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
  const { setUser, user, isLoading, setRole } = useAuthStore();
  const [isActivating, setIsActivating] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);
  const [shouldRedirect, setShouldRedirect] = useState<string | null>(null);

  // Получаем start_param из нескольких источников:
  // 1. URL параметр ?startapp=TOKEN (Direct Link формат: t.me/bot/app?startapp=TOKEN)
  // 2. URL параметр ?start=TOKEN (web_app кнопка)
  // 3. initDataUnsafe.start_param (deep link: t.me/bot?start=TOKEN)
  const urlParams = new URLSearchParams(window.location.search);
  const urlStartAppParam = urlParams.get('startapp'); // Direct Link формат
  const urlStartParam = urlParams.get('start');
  const tgStartParam = webApp?.initDataUnsafe?.start_param;
  const startParam = urlStartAppParam || urlStartParam || tgStartParam;
  
  // Отладка
  console.log('[App] webApp:', !!webApp, 'tgUser:', tgUser, 'startParam:', startParam, '(startapp:', urlStartAppParam, 'start:', urlStartParam, 'tg:', tgStartParam, ')');

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

  // Аутентификация и определение роли
  useEffect(() => {
    const authenticate = async () => {
      // URL параметр для тестирования (приоритет над всем)
      const urlParams = new URLSearchParams(window.location.search);
      const forceRole = urlParams.get('role');
      
      if (forceRole) {
        console.log('[Auth] Using forced role:', forceRole);
        setUser({
          id: forceRole === 'creator' ? 'dev-creator-id' : 'dev-student-id',
          telegramId: tgUser?.id || 123456789,
          firstName: tgUser?.first_name || 'Тестовый',
          lastName: tgUser?.last_name || (forceRole === 'creator' ? 'Создатель' : 'Ученик'),
          telegramUsername: tgUser?.username || 'test_user',
          role: forceRole as 'creator' | 'student' | 'admin',
          createdAt: new Date().toISOString(),
        });
        return;
      }

      // ============================================
      // ГЛАВНАЯ ЛОГИКА ОПРЕДЕЛЕНИЯ РОЛИ:
      // ============================================
      // 
      // 1. Есть start_param (invite token) → СТУДЕНТ
      //    Пользователь перешёл по ссылке-приглашению от преподавателя
      //    Активируем его и показываем курс
      //
      // 2. Нет start_param → ПРЕПОДАВАТЕЛЬ
      //    Пользователь открыл бота напрямую через Menu Button
      //    Показываем интерфейс создателя
      // ============================================

      if (startParam) {
        // СТУДЕНТ - перешёл по invite-ссылке
        console.log('[Auth] Student mode - checking token:', startParam);
        setIsActivating(true);
        
        try {
          // Проверяем токен (без активации)
          const { data } = await apiClient.get(`/students/check/${startParam}`);
          
          console.log('[Auth] Token check result:', data);
          
          // Устанавливаем пользователя как студента
          setUser({
            id: data.student?.userId || 'student-id',
            telegramId: tgUser?.id || 0,
            firstName: tgUser?.first_name || 'Ученик',
            lastName: tgUser?.last_name,
            telegramUsername: tgUser?.username,
            role: 'student',
            createdAt: new Date().toISOString(),
          });
          setRole('student');
          
          // Проверяем, активирован ли студент
          if (data.student?.invitationStatus === 'activated') {
            // Уже активирован → сразу на курс
            console.log('[Auth] Student already activated, redirecting to course');
            setShouldRedirect('/student/lessons');
          } else {
            // Не активирован → на страницу оплаты
            console.log('[Auth] Student not activated, redirecting to payment');
            setShouldRedirect(`/student/payment?accessToken=${startParam}`);
          }
          
        } catch (error: any) {
          console.error('[Auth] Token check error:', error);
          setActivationError(
            error.response?.data?.message || 
            'Недействительная ссылка приглашения.'
          );
          
          // Fallback - показываем как студента без курса
          setUser({
            id: 'guest-student',
            telegramId: tgUser?.id || 0,
            firstName: tgUser?.first_name || 'Гость',
            lastName: tgUser?.last_name,
            telegramUsername: tgUser?.username,
            role: 'student',
            createdAt: new Date().toISOString(),
          });
          setRole('student');
        } finally {
          setIsActivating(false);
        }
        
      } else {
        // ПРЕПОДАВАТЕЛЬ - открыл бота напрямую
        console.log('[Auth] Creator mode - direct bot access');
        
        // Пробуем получить данные с сервера и стать создателем
        if (webApp?.initData) {
          try {
            // Вызываем become-creator чтобы обновить роль на creator
            const { data } = await apiClient.post('/auth/become-creator');
            console.log('[Auth] User became creator:', data);
            
            setUser({
              id: data.id,
              telegramId: data.telegramId,
              firstName: data.firstName,
              lastName: data.lastName,
              telegramUsername: data.telegramUsername,
              role: 'creator',
              createdAt: data.createdAt,
            });
            return;
          } catch (error) {
            console.error('[Auth] API error, using mock creator:', error);
          }
        }
        
        // Fallback - мок создатель
        setUser({
          id: 'creator-id',
          telegramId: tgUser?.id || 123456789,
          firstName: tgUser?.first_name || 'Преподаватель',
          lastName: tgUser?.last_name,
          telegramUsername: tgUser?.username || 'creator',
          role: 'creator',
          createdAt: new Date().toISOString(),
        });
      }
    };

    if (webApp) {
      authenticate();
    }
  }, [webApp, tgUser, startParam, setUser]);

  // Загрузка WebApp
  if (!webApp) {
    return <LoadingScreen message="Открывайте приложение через Telegram" />;
  }

  // Активация студента
  if (isActivating) {
    return <LoadingScreen message="Активация приглашения..." />;
  }

  // Загрузка пользователя
  if (isLoading) {
    return <LoadingScreen message="Загрузка..." />;
  }

  // Ошибка активации
  if (activationError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{
        backgroundColor: 'var(--tg-theme-bg-color)',
        color: 'var(--tg-theme-text-color)',
      }}>
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <h2 className="text-xl font-semibold mb-2">Ошибка</h2>
          <p className="text-[var(--tg-theme-hint-color)] mb-4">{activationError}</p>
          <button
            onClick={() => webApp.close()}
            className="px-6 py-3 bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)] rounded-xl"
          >
            Закрыть
          </button>
        </div>
      </div>
    );
  }

  // Определяем маршрут по роли
  const getDefaultRoute = () => {
    if (user?.role === 'creator' || user?.role === 'admin') {
      return '/creator';
    }
    return '/student';
  };

  // Если есть редирект - выполняем его
  if (shouldRedirect) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<Navigate to={shouldRedirect} replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

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
