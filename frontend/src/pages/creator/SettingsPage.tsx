import { PageHeader } from '../../components/layout';
import { Card } from '../../components/ui';
import { useAuthStore } from '../../store';

export default function SettingsPage() {
  const { user } = useAuthStore();

  return (
    <div>
      <PageHeader title="Настройки" />

      <div className="p-4 space-y-4">
        {/* Профиль */}
        <Card>
          <h3 className="font-semibold text-[var(--tg-theme-text-color)] mb-3">
            👤 Профиль
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-[var(--tg-theme-hint-color)]">Имя</span>
              <span className="text-[var(--tg-theme-text-color)]">
                {user?.firstName} {user?.lastName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--tg-theme-hint-color)]">Telegram</span>
              <span className="text-[var(--tg-theme-text-color)]">
                @{user?.telegramUsername || 'не указан'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--tg-theme-hint-color)]">Роль</span>
              <span className="text-[var(--tg-theme-text-color)]">
                {user?.role === 'creator' ? '🎓 Создатель' : '📚 Ученик'}
              </span>
            </div>
          </div>
        </Card>

        {/* О приложении */}
        <Card>
          <h3 className="font-semibold text-[var(--tg-theme-text-color)] mb-3">
            ℹ️ О приложении
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--tg-theme-hint-color)]">Версия</span>
              <span className="text-[var(--tg-theme-text-color)]">3.0 MVP</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--tg-theme-hint-color)]">Платформа</span>
              <span className="text-[var(--tg-theme-text-color)]">Telegram Mini App</span>
            </div>
          </div>
        </Card>

        {/* Помощь */}
        <Card>
          <h3 className="font-semibold text-[var(--tg-theme-text-color)] mb-3">
            💬 Поддержка
          </h3>
          <p className="text-sm text-[var(--tg-theme-hint-color)]">
            Если у вас возникли вопросы или проблемы, напишите нам в Telegram.
          </p>
        </Card>
      </div>
    </div>
  );
}



