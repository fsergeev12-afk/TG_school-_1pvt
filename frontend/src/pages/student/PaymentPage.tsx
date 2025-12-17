import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/layout';
import { Card, Button, Input, Badge } from '../../components/ui';
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

  const validatePromo = useValidatePromoCode();
  const initPayment = useInitPayment();

  // TODO: Получить информацию о потоке
  const streamPrice = 3000; // 30 рублей в копейках

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
        // Бесплатный доступ
        navigate('/student');
      } else if (result.paymentUrl) {
        // Редирект на страницу оплаты
        window.location.href = result.paymentUrl;
      }
    } catch {
      // Ошибка обработается в UI
    }
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
    : streamPrice;

  return (
    <div>
      <PageHeader title="Оплата" showBack />

      <div className="p-4 space-y-4">
        {/* Информация о курсе */}
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-[var(--tg-theme-button-color)]/10 flex items-center justify-center text-2xl">
              📚
            </div>
            <div>
              <h3 className="font-semibold text-[var(--tg-theme-text-color)]">
                Название курса
              </h3>
              <p className="text-sm text-[var(--tg-theme-hint-color)]">
                10 уроков • Доступ навсегда
              </p>
            </div>
          </div>
        </Card>

        {/* Промокод */}
        <Card>
          <h3 className="font-semibold text-[var(--tg-theme-text-color)] mb-3">
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
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>
                    {promoApplied.isFree 
                      ? 'Бесплатный доступ!' 
                      : `Скидка ${formatMoney(promoApplied.discountAmount || 0)}`
                    }
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Промокод недействителен</span>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Итого */}
        <Card>
          <div className="space-y-2">
            <div className="flex justify-between text-[var(--tg-theme-text-color)]">
              <span>Стоимость курса</span>
              <span>{formatMoney(streamPrice)}</span>
            </div>
            
            {promoApplied?.valid && promoApplied.discountAmount && promoApplied.discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Скидка</span>
                <span>-{formatMoney(promoApplied.discountAmount)}</span>
              </div>
            )}
            
            <div className="border-t border-[var(--tg-theme-hint-color)]/20 pt-2 mt-2">
              <div className="flex justify-between">
                <span className="font-semibold text-[var(--tg-theme-text-color)]">
                  Итого
                </span>
                <span className="font-bold text-xl text-[var(--tg-theme-text-color)]">
                  {promoApplied?.isFree ? (
                    <Badge variant="success">Бесплатно</Badge>
                  ) : (
                    formatMoney(finalPrice)
                  )}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Кнопка оплаты */}
        <Button
          fullWidth
          size="lg"
          onClick={handlePay}
          loading={initPayment.isPending}
        >
          {promoApplied?.isFree ? 'Получить доступ' : 'Оплатить'}
        </Button>

        <p className="text-center text-sm text-[var(--tg-theme-hint-color)]">
          Нажимая кнопку, вы соглашаетесь с условиями оферты
        </p>
      </div>
    </div>
  );
}

