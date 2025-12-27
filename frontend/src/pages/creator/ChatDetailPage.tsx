import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useConversation, useMessages, useSendMessage, useMarkAsRead } from '../../api/hooks';
import { PageHeader } from '../../components/layout';
import { Button, Input } from '../../components/ui';

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
    <div className="flex flex-col h-screen">
      <PageHeader
        title={displayName}
        subtitle={conversation?.stream?.name}
        showBack
      />

      {/* Сообщения */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages?.slice().reverse().map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.senderType === 'creator' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`
                max-w-[80%] px-4 py-2 rounded-2xl
                ${msg.senderType === 'creator'
                  ? 'bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)] rounded-br-md'
                  : 'bg-[var(--tg-theme-secondary-bg-color)] text-[var(--tg-theme-text-color)] rounded-bl-md'
                }
              `}
            >
              <p className="whitespace-pre-wrap break-words">{msg.text}</p>
              <p className={`
                text-xs mt-1
                ${msg.senderType === 'creator' ? 'text-white/70' : 'text-[var(--tg-theme-hint-color)]'}
              `}>
                {new Date(msg.createdAt).toLocaleTimeString('ru-RU', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Поле ввода */}
      <div className="p-4 border-t border-[var(--tg-theme-hint-color)]/20 safe-area-pb">
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
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
}




