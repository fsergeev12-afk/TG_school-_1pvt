import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useConversation, useMessages, useSendMessage, useMarkAsRead } from '../../api/hooks';
import { PageContainer, PageHeader } from '../../components/layout';
import { Button, Input, Icons, Avatar } from '../../components/ui';

export default function ChatDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: conversation } = useConversation(id!);
  const { data: messages } = useMessages(id!);
  const sendMessage = useSendMessage();
  const markAsRead = useMarkAsRead();
  
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Отмечаем как прочитанное
  useEffect(() => {
    if (id && conversation?.unreadCount && conversation.unreadCount > 0) {
      markAsRead.mutate(id);
    }
  }, [id, conversation?.unreadCount]);

  // Скролл вниз при новых сообщениях
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || !id) return;
    
    try {
      await sendMessage.mutateAsync({ conversationId: id, text: text.trim() });
      setText('');
    } catch {
      // Ошибка обработается в UI
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const displayName = conversation?.telegramFirstName || 
    conversation?.telegramUsername || 
    `Chat ${conversation?.telegramChatId}`;

  return (
    <PageContainer className="flex flex-col h-screen">
      <PageHeader
        title={displayName}
        subtitle={conversation?.stream?.name}
        showBack
      />

      {/* Сообщения */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages?.slice().reverse().map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 ${msg.senderType === 'creator' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.senderType === 'student' && (
              <Avatar 
                firstName={conversation?.telegramFirstName}
                lastName={conversation?.telegramLastName}
                variant="neutral"
                size="sm"
                className="flex-shrink-0 mt-1"
              />
            )}
            <div
              className={`
                max-w-[75%] px-4 py-2.5 rounded-2xl shadow-soft
                ${msg.senderType === 'creator'
                  ? 'bg-[var(--purple-light)] text-dark rounded-br-md'
                  : 'bg-white/80 backdrop-blur-soft text-dark rounded-bl-md'
                }
              `}
            >
              <p className="text-[15px] whitespace-pre-wrap break-words leading-relaxed">{msg.text}</p>
              <p className={`
                text-[11px] mt-1.5
                ${msg.senderType === 'creator' ? 'text-[var(--text-medium)]' : 'text-secondary'}
              `}>
                {new Date(msg.createdAt).toLocaleTimeString('ru-RU', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
                {msg.senderType === 'creator' && (
                  <Icons.DoubleCheck className="inline-block ml-1 w-3 h-3" />
                )}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Поле ввода */}
      <div className="p-4 border-t border-[var(--purple-main)]/10 bg-white/40 backdrop-blur-soft safe-area-pb">
        <div className="flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Сообщение..."
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            loading={sendMessage.isPending}
            disabled={!text.trim()}
            size="md"
            className="w-12 h-12 !p-0"
          >
            <Icons.Telegram className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}




