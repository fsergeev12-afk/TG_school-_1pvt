import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePromoCodes, useCreatePromoCode, useDeletePromoCode, useStream } from '../../api/hooks';
import { PageContainer, PageContent, PageHeader } from '../../components/layout';
import { Button, Card, Input } from '../../components/ui';
import { useUIStore } from '../../store';

type PromoType = 'free' | 'percent_discount' | 'fixed_discount';

export default function PromoCodesPage() {
  const { streamId } = useParams<{ streamId: string }>();
  const navigate = useNavigate();
  const { data: stream } = useStream(streamId!);
  const { data: promoCodes, isLoading } = usePromoCodes(streamId!);
  const createPromo = useCreatePromoCode();
  const deletePromo = useDeletePromoCode();
  const { showToast } = useUIStore();

  const [isCreating, setIsCreating] = useState(false);
  const [code, setCode] = useState('');
  const [type, setType] = useState<PromoType>('free');
  const [discountValue, setDiscountValue] = useState(10);
  const [maxUsages, setMaxUsages] = useState<number | undefined>(undefined);
  const [unlimitedUsage, setUnlimitedUsage] = useState(true);
  const [expiresAt, setExpiresAt] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const resetForm = () => {
    setIsCreating(false);
    setCode('');
    setType('free');
    setDiscountValue(10);
    setMaxUsages(undefined);
    setUnlimitedUsage(true);
    setExpiresAt('');
  };

  const handleCreate = async () => {
    if (!code.trim() || !streamId) return;

    try {
      await createPromo.mutateAsync({
        streamId,
        code: code.trim().toUpperCase(),
        type,
        discountValue: type === 'free' ? undefined : discountValue,
        maxUsages: unlimitedUsage ? undefined : maxUsages,
        expiresAt: expiresAt || undefined,
      });
      resetForm();
      showToast('Промокод создан!', 'success');
    } catch {
      showToast('Ошибка создания промокода', 'error');
    }
  };

  const handleDelete = async (promoId: string) => {
    if (!streamId) return;
    try {
      await deletePromo.mutateAsync({ id: promoId, streamId });
      setDeletingId(null);
      showToast('Промокод удалён', 'success');
    } catch {
      showToast('Ошибка удаления', 'error');
    }
  };

  const getTypeIcon = (t: PromoType) => {
    switch (t) {
      case 'free': return '🎁';
      case 'percent_discount': return '📊';
      case 'fixed_discount': return '💰';
    }
  };

  const getTypeLabel = (t: PromoType, value?: number) => {
    switch (t) {
      case 'free': return 'Бесплатный доступ (100% скидка)';
      case 'percent_discount': return `Скидка ${value || 0}%`;
      case 'fixed_discount': return `Скидка ${value || 0} ₽`;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  return (
    <PageContainer>
      <PageHeader
        title="Промокоды"
        subtitle={stream?.name}
        showBack
        onBack={() => navigate(`/creator/streams/${streamId}`)}
      />

      <PageContent className="space-y-4">
        {/* Кнопка создания */}
        {!isCreating && (
          <Button fullWidth onClick={() => setIsCreating(true)}>
            ➕ Создать промокод
          </Button>
        )}

        {/* Форма создания */}
        {isCreating && (
          <Card className="space-y-4">
            <h3 className="font-semibold text-[var(--tg-theme-text-color)]">
              Создать промокод
            </h3>

            <Input
              label="Код промокода"
              placeholder="WELCOME"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              autoFocus
            />

            <div>
              <label className="block text-sm font-medium text-[var(--tg-theme-text-color)] mb-2">
                Тип скидки
              </label>
              <div className="space-y-2">
                {(['free', 'percent_discount', 'fixed_discount'] as PromoType[]).map((t) => (
                  <label
                    key={t}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                      type === t
                        ? 'bg-[var(--tg-theme-button-color)]/10 border-2 border-[var(--tg-theme-button-color)]'
                        : 'bg-[var(--tg-theme-secondary-bg-color)] border-2 border-transparent'
                    }`}
                  >
                    <input
                      type="radio"
                      name="promoType"
                      checked={type === t}
                      onChange={() => setType(t)}
                      className="w-4 h-4 accent-[var(--tg-theme-button-color)]"
                    />
                    <span className="text-[var(--tg-theme-text-color)]">
                      {getTypeIcon(t)} {t === 'free' ? 'Бесплатный доступ (100%)' : t === 'percent_discount' ? 'Скидка в %' : 'Фиксированная скидка'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {type !== 'free' && (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  className="w-24"
                />
                <span className="text-[var(--tg-theme-text-color)]">
                  {type === 'percent_discount' ? '%' : '₽'}
                </span>
              </div>
            )}

            <Input
              label="Срок действия (до)"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />

            <div>
              <label className="block text-sm font-medium text-[var(--tg-theme-text-color)] mb-2">
                Лимит использований
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="limit"
                    checked={unlimitedUsage}
                    onChange={() => setUnlimitedUsage(true)}
                    className="w-4 h-4 accent-[var(--tg-theme-button-color)]"
                  />
                  <span className="text-[var(--tg-theme-text-color)]">Неограниченно</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="limit"
                    checked={!unlimitedUsage}
                    onChange={() => setUnlimitedUsage(false)}
                    className="w-4 h-4 accent-[var(--tg-theme-button-color)]"
                  />
                  <span className="text-[var(--tg-theme-text-color)]">Ограничено:</span>
                  {!unlimitedUsage && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={maxUsages || 10}
                        onChange={(e) => setMaxUsages(Number(e.target.value))}
                        className="w-20"
                      />
                      <span className="text-sm text-[var(--tg-theme-hint-color)]">человек</span>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" onClick={resetForm}>
                Отмена
              </Button>
              <Button
                fullWidth
                onClick={handleCreate}
                loading={createPromo.isPending}
                disabled={!code.trim()}
              >
                Создать
              </Button>
            </div>
          </Card>
        )}

        {/* Загрузка */}
        {isLoading && (
          <div className="text-center py-8 text-[var(--tg-theme-hint-color)]">
            Загрузка...
          </div>
        )}

        {/* Пустой список */}
        {!isLoading && promoCodes?.length === 0 && !isCreating && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🎟️</div>
            <p className="text-[var(--tg-theme-hint-color)]">
              Пока нет промокодов
            </p>
            <p className="text-sm text-[var(--tg-theme-hint-color)] mt-1">
              Создайте первый промокод
            </p>
          </div>
        )}

        {/* Список промокодов */}
        {promoCodes?.map((promo) => (
          <Card key={promo.id}>
            {deletingId === promo.id ? (
              <div className="space-y-3">
                <p className="text-sm text-[var(--tg-theme-text-color)]">
                  Удалить промокод "{promo.code}"?
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setDeletingId(null)}
                  >
                    Отмена
                  </Button>
                  <Button
                    size="sm"
                    className="bg-red-500 hover:bg-red-600"
                    onClick={() => handleDelete(promo.id)}
                    loading={deletePromo.isPending}
                  >
                    Удалить
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <div className="text-2xl">{getTypeIcon(promo.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[var(--tg-theme-text-color)] text-lg">
                    {promo.code}
                  </div>
                  <p className="text-sm text-[var(--tg-theme-hint-color)]">
                    {getTypeLabel(promo.type, promo.discountValue)}
                  </p>
                  <p className="text-xs text-[var(--tg-theme-hint-color)] mt-1">
                    Использовано: {promo.usageCount} / {promo.maxUsages || '∞'}
                  </p>
                  {promo.expiresAt && (
                    <p className="text-xs text-[var(--tg-theme-hint-color)]">
                      Действителен до: {formatDate(promo.expiresAt)}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setDeletingId(promo.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded"
                >
                  🗑️
                </button>
              </div>
            )}
          </Card>
        ))}
      </PageContent>
    </PageContainer>
  );
}

