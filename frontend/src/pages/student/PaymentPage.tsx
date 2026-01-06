import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/layout';
import { Card, Button, Input } from '../../components/ui';
import { useValidatePromoCode } from '../../api/hooks';
import { apiClient } from '../../api/client';
import { useUIStore } from '../../store';

export default function PaymentPage() {
  const navigate = useNavigate();
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
        const { data } = await apiClient.get(`/students/check/${accessToken}`);
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
    const botUsername = process.env.REACT_APP_BOT_USERNAME || 'Bllocklyyy_bot';
    window.open(`https://t.me/${botUsername}`, '_blank');
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[var(--tg-theme-hint-color)]">Загрузка...</div>
      </div>
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
  const hasDiscount = promoApplied?.valid && promoApplied.discountAmount > 0;

  // Подсчет уроков и блоков
  const blocksCount = course?.blocks?.length || 0;
  const lessonsCount = course?.blocks?.reduce((sum: number, block: any) => 
    sum + (block.lessons?.length || 0), 0
  ) || 0;

  return (
    <div className="min-h-screen">
      <PageHeader title="💳 Оплата проекта" showBack />

      <div className="p-4 space-y-4">
        {/* Карточка курса БЕЗ обложки */}
        <Card>
          <h2 className="font-semibold text-lg text-[var(--tg-theme-text-color)] break-words mb-2">
            {course?.title || 'Без названия'}
          </h2>
          <p className="text-[var(--tg-theme-hint-color)] mb-1">
            От {course?.creator?.firstName || 'Неизвестный автор'}
          </p>
          <p className="text-sm text-[var(--tg-theme-hint-color)]">
            {lessonsCount} материалов в {blocksCount} разделах
          </p>
        </Card>

        {/* Цена и оплата */}
        <Card>
          <div className="text-center">
            {promoApplied?.isFree ? (
              <p className="text-3xl font-bold text-green-600 mb-4">
                Бесплатно
              </p>
            ) : (
              <>
                {hasDiscount && (
                  <p className="text-xl text-[var(--tg-theme-hint-color)] line-through mb-1">
                    {formatMoney(originalPrice)}
                  </p>
                )}
                <p className="text-3xl font-bold text-[var(--tg-theme-text-color)] mb-2">
                  {formatMoney(finalPrice)}
                </p>
                {hasDiscount && (
                  <p className="text-green-600 text-sm mb-4">
                    Скидка: -{formatMoney(promoApplied.discountAmount)}
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
              <p className="text-xs text-[var(--tg-theme-hint-color)] mt-3">
                ℹ️ Реальные платежи пока не подключены
              </p>
            )}
          </div>
        </Card>

        {/* Промокод */}
        <Card>
          <h3 className="font-semibold text-[var(--tg-theme-text-color)] mb-3 flex items-center gap-2">
            <span>🎁</span>
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
              onClick={handleValidatePromo}
              loading={validatePromo.isPending}
              disabled={!promoCode.trim()}
            >
              Применить
            </Button>
          </div>
          
          {promoApplied !== null && (
            <div className="mt-2">
              {promoApplied.valid ? (
                <div className="flex items-center gap-2 text-green-600">
                  <span>✓</span>
                  <span>Промокод применён!</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-500">
                  <span>✕</span>
                  <span>Промокод недействителен</span>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Вопросы */}
        <Card>
          <div className="text-center">
            <p className="text-[var(--tg-theme-text-color)] mb-1">
              ❓ Остались вопросы?
            </p>
            <p className="text-sm text-[var(--tg-theme-hint-color)] mb-3">
              Напишите нам перед покупкой
            </p>
            <Button 
              variant="secondary"
              onClick={handleAskQuestion}
            >
              💬 Задать вопрос
            </Button>
          </div>
        </Card>
      </div>

      {/* Модалка успешной активации */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-[var(--tg-theme-bg-color)] rounded-2xl p-6 max-w-sm w-full text-center">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="font-semibold text-lg text-[var(--tg-theme-text-color)] mb-2">
              Оплата прошла успешно!
            </h3>
            <p className="text-[var(--tg-theme-hint-color)] mb-4">
              Теперь у вас есть доступ к проекту
            </p>
            <Button fullWidth onClick={() => navigate('/student/lessons')}>
              Перейти к проекту
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
