import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTelegram } from './hooks/useTelegram';
import { useEffect, useState } from 'react';
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
    // Если уже есть пользователь, не повторяем аутентификацию
    if (user) {
      console.log('[Auth] User already exists, skipping authentication');
      return;
    }

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

      // ШАГ 1: Всегда сначала получаем данные пользователя с сервера
      let serverUser = null;
      if (webApp?.initData) {
        try {
          const { data } = await apiClient.get('/auth/me');
          serverUser = data;
          console.log('[Auth] Server user data:', serverUser);
        } catch (error) {
          console.log('[Auth] No existing user on server, will create new');
        }
      }

      if (startParam) {
        // РЕЖИМ INVITE-ССЫЛКИ
        // Пользователь перешёл по ссылке-приглашению от преподавателя
        console.log('[Auth] Invite link mode - checking token:', startParam);
        setIsActivating(true);
        
        try {
          // Проверяем токен (без активации)
          const { data } = await apiClient.get(`/students/check/${startParam}`);
          
          console.log('[Auth] Token check result:', data);
          
          // Устанавливаем пользователя как студента
          setUser({
            id: serverUser?.id || data.student?.userId || 'student-id',
            telegramId: tgUser?.id || 0,
            firstName: tgUser?.first_name || 'Ученик',
            lastName: tgUser?.last_name,
            telegramUsername: tgUser?.username,
            role: 'student',
            createdAt: new Date().toISOString(),
          });
          
          // Проверяем статус студента
          const studentActivated = data.student?.invitationStatus === 'activated';
          const studentPaid = data.student?.paymentStatus === 'paid';
          const requiresPayment = (data.student?.stream?.price || data.stream?.price || 0) > 0;
          
          console.log('[Auth] Student status:', { studentActivated, studentPaid, requiresPayment });
          
          if (studentActivated && (!requiresPayment || studentPaid)) {
            // Уже активирован И (бесплатный ИЛИ оплачен) → сразу на курс
            console.log('[Auth] Student has access, redirecting to course');
            setShouldRedirect('/student/lessons');
          } else {
            // Не активирован ИЛИ не оплачен → на страницу оплаты
            console.log('[Auth] Student needs payment, redirecting to payment page');
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
        } finally {
          setIsActivating(false);
        }
        
      } else if (serverUser) {
        // РЕЖИМ СУЩЕСТВУЮЩЕГО ПОЛЬЗОВАТЕЛЯ
        // Используем роль с сервера (не меняем автоматически!)
        console.log('[Auth] Existing user mode - using server role:', serverUser.role);
        
        setUser({
          id: serverUser.id,
          telegramId: serverUser.telegramId,
          firstName: serverUser.firstName,
          lastName: serverUser.lastName,
          telegramUsername: serverUser.telegramUsername,
          role: serverUser.role,
          createdAt: serverUser.createdAt,
        });
        
      } else {
        // РЕЖИМ НОВОГО ПОЛЬЗОВАТЕЛЯ (без invite-ссылки)
        // Новый пользователь открыл бота напрямую → становится создателем
        console.log('[Auth] New user mode - becoming creator');
        
        if (webApp?.initData) {
          try {
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
            console.error('[Auth] API error, using fallback creator:', error);
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
  }, [webApp, tgUser, startParam]); // убрали setUser из dependencies

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
    // Если есть редирект (студент по invite-ссылке) - используем его
    if (shouldRedirect) {
      return shouldRedirect;
    }
    if (user?.role === 'creator' || user?.role === 'admin') {
      return '/creator';
    }
    // Студенты по умолчанию попадают на страницу материалов (не на главную с оплатой)
    return '/student/lessons';
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
