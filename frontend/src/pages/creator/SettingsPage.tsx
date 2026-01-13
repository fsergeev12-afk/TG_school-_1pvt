import { PageContainer, PageContent, PageHeader } from '../../components/layout';
import { Card, Button, Icons, Avatar } from '../../components/ui';
import { useAuthStore } from '../../store';

export default function SettingsPage() {
  const { user } = useAuthStore();

  return (
    <PageContainer>
      <PageHeader title="Настройки" />

      <PageContent>
        {/* Профиль */}
        <Card variant="active" accentLine>
          <div className="flex items-center gap-3 mb-4">
            <Avatar 
              firstName={user?.firstName}
              lastName={user?.lastName}
              variant="accent"
              size="lg"
            />
            <div>
              <h3 className="font-semibold text-[17px] text-dark">
                {user?.firstName} {user?.lastName}
              </h3>
              <p className="text-[13px] text-secondary">
                {user?.role === 'creator' ? 'Создатель' : 'Ученик'}
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[14px] text-secondary">Telegram</span>
              <span className="text-[14px] text-dark font-medium">
                @{user?.telegramUsername || 'не указан'}
              </span>
            </div>
          </div>
        </Card>

        {/* О приложении */}
        <Card variant="normal">
          <div className="flex items-center gap-2 mb-3">
            <Icons.Info className="w-5 h-5 text-[var(--purple-main)]" />
            <h3 className="font-semibold text-[16px] text-dark">
              О приложении
            </h3>
          </div>
          <div className="space-y-2 text-[14px]">
            <div className="flex justify-between">
              <span className="text-secondary">Версия</span>
              <span className="text-dark">4.0 Desert Sunset</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary">Платформа</span>
              <span className="text-dark">Telegram Mini App</span>
            </div>
          </div>
        </Card>

        {/* Помощь */}
        <Card variant="normal">
          <div className="flex items-center gap-2 mb-3">
            <Icons.Chat className="w-5 h-5 text-[var(--purple-main)]" />
            <h3 className="font-semibold text-[16px] text-dark">
              Поддержка
            </h3>
          </div>
          <p className="text-[14px] text-secondary mb-4">
            Если у вас возникли вопросы или проблемы, напишите нам в Telegram.
          </p>
          <Button
            fullWidth
            variant="secondary"
            size="md"
            onClick={() => window.open('https://t.me/FedorSergeev12', '_blank')}
          >
            <Icons.Telegram className="w-4 h-4" />
            Задать вопрос
          </Button>
        </Card>
      </PageContent>
    </PageContainer>
  );
}



