import { useNavigate } from 'react-router-dom';
import { useConversations } from '../../api/hooks';
import { PageHeader } from '../../components/layout';
import { Card, Badge } from '../../components/ui';

export default function ChatsPage() {
  const navigate = useNavigate();
  const { data: conversations, isLoading } = useConversations();

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'сейчас';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} мин`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ч`;
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  return (
    <div>
      <PageHeader title="Чаты" />

      <div className="p-4">
        {isLoading && (
          <div className="text-center py-8 text-[var(--tg-theme-hint-color)]">
            Загрузка...
          </div>
        )}

        {!isLoading && conversations?.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-[var(--tg-theme-hint-color)]">
              Пока нет сообщений
            </p>
            <p className="text-sm text-[var(--tg-theme-hint-color)] mt-1">
              Сообщения от учеников появятся здесь
            </p>
          </div>
        )}

        <div className="space-y-2">
          {conversations?.map((conv) => (
            <Card
              key={conv.id}
              onClick={() => navigate(`/creator/chats/${conv.id}`)}
              padding="sm"
              className="active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[var(--tg-theme-button-color)]/10 flex items-center justify-center text-xl">
                  👤
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-[var(--tg-theme-text-color)] truncate">
                      {conv.telegramFirstName || conv.telegramUsername || `Chat ${conv.telegramChatId}`}
                    </span>
                    <span className="text-xs text-[var(--tg-theme-hint-color)]">
                      {formatTime(conv.lastMessageAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p className="text-sm text-[var(--tg-theme-hint-color)] truncate">
                      {conv.stream?.name || 'Без потока'}
                    </p>
                    {conv.unreadCount > 0 && (
                      <Badge variant="error" size="sm">
                        {conv.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}



