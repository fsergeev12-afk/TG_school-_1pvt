import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConversations } from '../../api/hooks';
import { PageContainer, PageContent, PageHeader } from '../../components/layout';
import { Card, Badge, Input, Icons, Avatar } from '../../components/ui';

export default function ChatsPage() {
  const navigate = useNavigate();
  const { data: conversations, isLoading } = useConversations();
  const [searchQuery, setSearchQuery] = useState('');

  // Фильтрация чатов по поисковому запросу
  const filteredConversations = useMemo(() => {
    if (!conversations) return [];
    if (!searchQuery.trim()) return conversations;

    const query = searchQuery.toLowerCase();
    return conversations.filter(conv => {
      const firstName = (conv.telegramFirstName || '').toLowerCase();
      const lastName = (conv.telegramLastName || '').toLowerCase();
      const username = (conv.telegramUsername || '').toLowerCase();
      const streamName = (conv.stream?.name || '').toLowerCase();

      return (
        firstName.includes(query) ||
        lastName.includes(query) ||
        username.includes(query) ||
        streamName.includes(query)
      );
    });
  }, [conversations, searchQuery]);

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
    <PageContainer>
      <PageHeader title="Чаты" />

      <PageContent>
        {/* Поиск */}
        {conversations && conversations.length > 0 && (
          <div className="relative mb-4">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <Icons.Search className="w-4 h-4 text-secondary" />
            </div>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по имени или потоку..."
              className="pl-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-dark"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {isLoading && (
          <div className="text-center py-8 text-secondary text-[15px]">
            Загрузка...
          </div>
        )}

        {!isLoading && conversations?.length === 0 && (
          <div className="text-center py-12">
            <Icons.Chat className="w-16 h-16 mx-auto mb-4 text-[var(--purple-main)]" />
            <p className="text-[15px] text-dark mb-1">
              Пока нет сообщений
            </p>
            <p className="text-[13px] text-secondary">
              Сообщения от учеников появятся здесь
            </p>
          </div>
        )}

        {!isLoading && conversations && conversations.length > 0 && filteredConversations.length === 0 && (
          <div className="text-center py-12">
            <Icons.Search className="w-16 h-16 mx-auto mb-4 text-[var(--purple-main)]" />
            <p className="text-[15px] text-dark mb-1">
              Ничего не найдено
            </p>
            <p className="text-[13px] text-secondary">
              Попробуйте изменить запрос
            </p>
          </div>
        )}

        <div className="space-y-3">
          {filteredConversations?.map((conv) => (
            <Card
              key={conv.id}
              variant={conv.unreadCount > 0 ? 'active' : 'normal'}
              accentLine={conv.unreadCount > 0}
              onClick={() => navigate(`/creator/chats/${conv.id}`)}
              className="active:opacity-90 transition-opacity cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Avatar 
                  firstName={conv.telegramFirstName}
                  lastName={conv.telegramLastName}
                  variant="accent"
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-[16px] text-dark truncate">
                      {conv.telegramFirstName || conv.telegramUsername || `Chat ${conv.telegramChatId}`}
                    </span>
                    <span className="text-[11px] text-muted">
                      {formatTime(conv.lastMessageAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[13px] text-secondary truncate flex items-center gap-1">
                      <Icons.Users className="w-3 h-3" />
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
      </PageContent>
    </PageContainer>
  );
}




