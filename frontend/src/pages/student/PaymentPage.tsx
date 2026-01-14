import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useTelegram } from '../../hooks/useTelegram';
import { PageContainer, PageContent, PageHeader } from '../../components/layout';
import { Card, Button, Input, Icons } from '../../components/ui';
import { useValidatePromoCode } from '../../api/hooks';
import { apiClient } from '../../api/client';
import { useUIStore } from '../../store';

export default function PaymentPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: tgUser } = useTelegram();
  const [searchParams] = useSearchParams();
  const accessToken = searchParams.get('accessToken') || '';
  const { showToast } = useUIStore();
  
  const [loading, setLoading] = useState(true);
  const [courseData, setCourseData] = useState<any>(null);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState<{
    valid: boolean;
    discountAmount?: number;
    finalPrice?: number;
    isFree?: boolean;
  } | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  const validatePromo = useValidatePromoCode();

  // Получаем данные о курсе
  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        const { data } = await apiClient.get(`/students/check/${accessToken}`, {
          params: { 
            telegramId: tgUser?.id,
            firstName: tgUser?.first_name,
            lastName: tgUser?.last_name,
            username: tgUser?.username,
          },
        });
        console.log('[PaymentPage] Course data:', data);
        setCourseData(data);
      } catch (error: any) {
        console.error('[PaymentPage] Error fetching course data:', error);
        showToast('Недействительная ссылка приглашения', 'error');
        navigate('/student');
      } finally {
        setLoading(false);
      }
    };

    if (accessToken) {
      fetchCourseData();
    } else {
      showToast('Отсутствует токен доступа', 'error');
      navigate('/student');
    }
  }, [accessToken, navigate, showToast]);

  const handleValidatePromo = async () => {
    if (!promoCode.trim() || !courseData) return;

    const streamId = courseData.student?.stream?.id || courseData.stream?.id;

    try {
      const result = await validatePromo.mutateAsync({
        code: promoCode.trim(),
        streamId,
      });
      setPromoApplied(result);
      if (result.valid) {
        showToast('Промокод применён!', 'success');
      }
    } catch {
      setPromoApplied({ valid: false });
      showToast('Промокод недействителен', 'error');
    }
  };

  const handleActivate = async () => {
    if (!accessToken) return;

    setIsActivating(true);

    try {
      // Активируем студента с промокодом
      await apiClient.post('/students/activate', { 
        accessToken,
        promoCode: promoApplied?.valid ? promoCode.trim() : undefined,
      });

      // ВАЖНО: Инвалидируем кэш чтобы обновить список курсов
      queryClient.invalidateQueries({ queryKey: ['student', 'courses'] });

      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('[PaymentPage] Activation error:', error);
      showToast(error.response?.data?.message || 'Ошибка активации', 'error');
    } finally {
      setIsActivating(false);
    }
  };

  const handleAskQuestion = () => {
    // Открываем бота без параметров для создания диалога
    const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'Bllocklyyy_bot';
    const botUrl = `https://t.me/${botUsername}`;
    const tg = window.Telegram?.WebApp;
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(botUrl);
    } else {
      window.open(botUrl, '_blank');
    }
  };

  const formatMoney = (kopecks: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(kopecks / 100);
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-secondary text-[15px]">Загрузка...</div>
        </div>
      </PageContainer>
    );
  }

  if (!courseData) {
    return null;
  }

  const stream = courseData.student?.stream || courseData.stream;
  const course = stream?.course;
  const originalPrice = stream?.price || 0;
  const finalPrice = promoApplied?.valid 
    ? promoApplied.finalPrice || 0 
    : originalPrice;
  const hasDiscount = promoApplied?.valid && (promoApplied.discountAmount ?? 0) > 0;

  // Подсчет уроков и блоков
  const blocksCount = course?.blocks?.length || 0;
  const lessonsCount = course?.blocks?.reduce((sum: number, block: any) => 
    sum + (block.lessons?.length || 0), 0
  ) || 0;

  return (
    <PageContainer>
      <PageHeader title="Оплата проекта" showBack />

      <PageContent>
        {/* Карточка проекта */}
        <Card variant="active" accentLine className="text-center">
          <Icons.Book className="w-12 h-12 mx-auto mb-3 text-[var(--terracotta-main)]" />
          <h2 className="font-semibold text-[20px] text-dark break-words mb-2">
            {stream?.name || 'Без названия'}
          </h2>
          <p className="text-[14px] text-secondary mb-1">
            От {course?.creator?.firstName || 'Неизвестный автор'}
          </p>
          <p className="text-[13px] text-muted">
            {lessonsCount} материалов в {blocksCount} разделах
          </p>
        </Card>

        {/* Цена и оплата */}
        <Card variant="active" className="text-center mt-4">
          {promoApplied?.isFree ? (
            <p className="text-[32px] font-bold text-[var(--success)] mb-4">
              Бесплатно
            </p>
          ) : (
            <>
              {hasDiscount && (
                <p className="text-[20px] text-secondary line-through mb-1">
                  {formatMoney(originalPrice)}
                </p>
              )}
              <p className="text-[32px] font-bold text-dark mb-2">
                {formatMoney(finalPrice)}
              </p>
              {hasDiscount && (
                <p className="text-[var(--success)] text-[15px] mb-4">
                  Скидка: -{formatMoney(promoApplied?.discountAmount ?? 0)}
                </p>
              )}
            </>
          )}

          <Button
            fullWidth
            size="lg"
            onClick={handleActivate}
            loading={isActivating}
            disabled={!promoApplied?.valid || !promoApplied?.isFree}
          >
            {promoApplied?.isFree ? 'Получить доступ' : 'Оплатить'}
          </Button>

          {!promoApplied?.isFree && (
            <div className="flex items-center justify-center gap-1 mt-3 text-secondary text-[12px]">
              <Icons.Info className="w-3 h-3" />
              <span>Реальные платежи пока не подключены</span>
            </div>
          )}
        </Card>

        {/* Промокод */}
        <Card variant="normal" className="mt-4">
          <h3 className="font-semibold text-[16px] text-dark mb-3 flex items-center gap-2">
            <Icons.Ticket className="w-5 h-5 text-[var(--terracotta-main)]" />
            Есть промокод?
          </h3>
          <div className="flex gap-2">
            <Input
              value={promoCode}
              onChange={(e) => {
                setPromoCode(e.target.value.toUpperCase());
                setPromoApplied(null);
              }}
              placeholder="ПРОМОКОД"
              className="flex-1 uppercase"
            />
            <Button
              size="md"
              onClick={handleValidatePromo}
              loading={validatePromo.isPending}
              disabled={!promoCode.trim()}
            >
              Применить
            </Button>
          </div>
          
          {promoApplied !== null && (
            <div className="mt-3 flex items-center gap-2 text-[14px]">
              {promoApplied.valid ? (
                <>
                  <Icons.Check className="w-4 h-4 text-[var(--success)]" />
                  <span className="text-[var(--success)]">Промокод применён!</span>
                </>
              ) : (
                <>
                  <Icons.Info className="w-4 h-4 text-[var(--error)]" />
                  <span className="text-[var(--error)]">Промокод недействителен</span>
                </>
              )}
            </div>
          )}
        </Card>

        {/* Вопросы */}
        <Card variant="normal" className="text-center mt-4">
          <Icons.Question className="w-10 h-10 mx-auto mb-2 text-[var(--purple-main)]" />
          <p className="text-[15px] text-dark font-medium mb-1">
            Остались вопросы?
          </p>
          <p className="text-[13px] text-secondary mb-3">
            Напишите нам перед покупкой
          </p>
          <Button 
            variant="secondary"
            size="md"
            onClick={handleAskQuestion}
          >
            <Icons.Chat className="w-4 h-4" />
            Задать вопрос
          </Button>
        </Card>
      </PageContent>

      {/* Модалка успешной активации */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <Card variant="active" className="max-w-sm w-full text-center p-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--success)]/10 flex items-center justify-center">
              <Icons.Check className="w-10 h-10 text-[var(--success)]" />
            </div>
            <h3 className="font-semibold text-[20px] text-dark mb-2">
              Оплата прошла успешно!
            </h3>
            <p className="text-[14px] text-secondary mb-5">
              Теперь у вас есть доступ к проекту
            </p>
            <Button fullWidth size="lg" onClick={() => navigate('/student/lessons')}>
              Перейти к проекту
            </Button>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}
