import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/layout';
import { Card, Button, Input } from '../../components/ui';
import { useValidatePromoCode, useInitPayment } from '../../api/hooks';

export default function PaymentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const streamId = searchParams.get('streamId') || '';
  
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState<{
    valid: boolean;
    discountAmount?: number;
    finalPrice?: number;
    isFree?: boolean;
  } | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const validatePromo = useValidatePromoCode();
  const initPayment = useInitPayment();

  // TODO: Получить информацию о потоке и курсе из API
  const course = {
    title: 'Основы тайм-менеджмента',
    authorName: 'Анны Ивановой',
    lessonsCount: 9,
    blocksCount: 3,
    coverUrl: null,
    price: 300000, // 3000 рублей в копейках
  };

  const handleValidatePromo = async () => {
    if (!promoCode.trim()) return;

    try {
      const result = await validatePromo.mutateAsync({
        code: promoCode.trim(),
        streamId,
      });
      setPromoApplied(result);
    } catch {
      setPromoApplied({ valid: false });
    }
  };

  const handlePay = async () => {
    try {
      const result = await initPayment.mutateAsync({
        streamId,
        promoCode: promoApplied?.valid ? promoCode : undefined,
      });

      if (result.isFree) {
        // Бесплатный доступ по промокоду
        setShowSuccessModal(true);
      } else if (result.paymentUrl) {
        // Редирект на страницу оплаты
        window.location.href = result.paymentUrl;
      } else {
        // Если нет URL - показываем успех (для тестирования)
        setShowSuccessModal(true);
      }
    } catch {
      setShowErrorModal(true);
    }
  };

  const handleAskQuestion = () => {
    window.open('https://t.me/TG_school_1pvt_bot', '_blank');
  };

  const formatMoney = (kopecks: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(kopecks / 100);
  };

  const finalPrice = promoApplied?.valid 
    ? promoApplied.finalPrice || 0 
    : course.price;

  return (
    <div className="min-h-screen">
      <PageHeader title="Оплата курса" showBack />

      <div className="p-4 space-y-4">
        {/* Карточка курса с обложкой */}
        <Card className="overflow-hidden">
          {/* Обложка */}
          <div className="aspect-[16/9] relative -mx-4 -mt-4 mb-4">
            {course.coverUrl ? (
              <img 
                src={course.coverUrl} 
                alt={course.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 flex items-center justify-center">
                <span className="text-white/50 text-sm">[Изображение курса]</span>
              </div>
            )}
          </div>

          {/* Информация */}
          <div>
            <h2 className="font-semibold text-lg text-[var(--tg-theme-text-color)] break-words">
              {course.title}
            </h2>
            <p className="text-[var(--tg-theme-hint-color)]">
              От {course.authorName}
            </p>
            <p className="text-sm text-[var(--tg-theme-hint-color)]">
              {course.lessonsCount} уроков в {course.blocksCount} блоках
            </p>
          </div>
        </Card>

        {/* Цена и оплата */}
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-[var(--tg-theme-text-color)] mb-4">
              {promoApplied?.isFree ? 'Бесплатно' : formatMoney(finalPrice)}
            </p>
            
            {promoApplied?.valid && promoApplied.discountAmount && promoApplied.discountAmount > 0 && (
              <p className="text-green-600 text-sm mb-4">
                Скидка: -{formatMoney(promoApplied.discountAmount)}
              </p>
            )}

            <Button
              fullWidth
              size="lg"
              onClick={handlePay}
              loading={initPayment.isPending}
            >
              {promoApplied?.isFree ? 'Получить доступ' : 'Оплатить'}
            </Button>
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

      {/* Модалка успешной оплаты */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-[var(--tg-theme-bg-color)] rounded-2xl p-6 max-w-sm w-full text-center">
            <button 
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-4 right-4 text-[var(--tg-theme-hint-color)]"
            >
              ✕
            </button>
            <div className="text-5xl mb-4">✅</div>
            <h3 className="font-semibold text-lg text-[var(--tg-theme-text-color)] mb-2">
              Оплата прошла успешно!
            </h3>
            <p className="text-[var(--tg-theme-hint-color)] mb-4">
              Теперь у вас есть доступ к курсу
            </p>
            <Button fullWidth onClick={() => navigate('/student')}>
              Перейти к курсу
            </Button>
          </div>
        </div>
      )}

      {/* Модалка ошибки */}
      {showErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-[var(--tg-theme-bg-color)] rounded-2xl p-6 max-w-sm w-full text-center">
            <button 
              onClick={() => setShowErrorModal(false)}
              className="absolute top-4 right-4 text-[var(--tg-theme-hint-color)]"
            >
              ✕
            </button>
            <div className="text-5xl mb-4">❌</div>
            <h3 className="font-semibold text-lg text-[var(--tg-theme-text-color)] mb-2">
              Оплата не прошла
            </h3>
            <p className="text-[var(--tg-theme-hint-color)] mb-4">
              Произошла ошибка при обработке платежа. Попробуйте ещё раз.
            </p>
            <Button fullWidth onClick={() => setShowErrorModal(false)}>
              Повторить попытку
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
