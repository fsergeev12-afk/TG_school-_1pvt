import { usePaymentStats } from '../../api/hooks';
import { PageHeader } from '../../components/layout';
import { Card } from '../../components/ui';

export default function StatsPage() {
  const { data: stats, isLoading } = usePaymentStats();

  const formatMoney = (kopecks: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(kopecks / 100);
  };

  return (
    <div>
      <PageHeader title="Статистика" />

      <div className="p-4 space-y-4">
        {isLoading && (
          <div className="text-center py-8 text-[var(--tg-theme-hint-color)]">
            Загрузка...
          </div>
        )}

        {stats && (
          <>
            {/* Главная метрика */}
            <Card className="text-center">
              <p className="text-sm text-[var(--tg-theme-hint-color)]">Общий доход</p>
              <p className="text-3xl font-bold text-[var(--tg-theme-text-color)] mt-1">
                {formatMoney(stats.totalRevenue)}
              </p>
            </Card>

            {/* Детальная статистика */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <p className="text-sm text-[var(--tg-theme-hint-color)]">Всего платежей</p>
                <p className="text-2xl font-bold text-[var(--tg-theme-text-color)]">
                  {stats.totalPayments}
                </p>
              </Card>
              <Card>
                <p className="text-sm text-[var(--tg-theme-hint-color)]">Успешных</p>
                <p className="text-2xl font-bold text-green-500">
                  {stats.completedPayments}
                </p>
              </Card>
              <Card>
                <p className="text-sm text-[var(--tg-theme-hint-color)]">Ожидают</p>
                <p className="text-2xl font-bold text-yellow-500">
                  {stats.pendingPayments}
                </p>
              </Card>
              <Card>
                <p className="text-sm text-[var(--tg-theme-hint-color)]">Средний чек</p>
                <p className="text-2xl font-bold text-[var(--tg-theme-text-color)]">
                  {formatMoney(stats.averagePayment)}
                </p>
              </Card>
            </div>

            {/* Подсказка */}
            <p className="text-center text-sm text-[var(--tg-theme-hint-color)]">
              Статистика по всем потокам
            </p>
          </>
        )}
      </div>
    </div>
  );
}



