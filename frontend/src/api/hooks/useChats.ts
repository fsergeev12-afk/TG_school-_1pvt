import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import { Conversation, Message } from '../../types';

export const useConversations = () => {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data } = await apiClient.get<Conversation[]>('/chats');
      return data;
    },
    refetchInterval: 60000, // Обновляем каждую минуту
    refetchOnWindowFocus: true,
    staleTime: 30000, // Данные актуальны 30 секунд
  });
};

export const useUnreadCount = () => {
  return useQuery({
    queryKey: ['conversations', 'unread'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ unreadCount: number }>('/chats/unread-count');
      return data.unreadCount;
    },
    refetchInterval: 30000, // Обновляем каждые 30 секунд
  });
};

export const useConversation = (id: string) => {
  return useQuery({
    queryKey: ['conversation', id],
    queryFn: async () => {
      const { data } = await apiClient.get<Conversation>(`/chats/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

export const useMessages = (conversationId: string, limit = 50, offset = 0) => {
  return useQuery({
    queryKey: ['conversation', conversationId, 'messages', limit, offset],
    queryFn: async () => {
      const { data } = await apiClient.get<Message[]>(
        `/chats/${conversationId}/messages?limit=${limit}&offset=${offset}`
      );
      return data;
    },
    enabled: !!conversationId,
    refetchInterval: 30000, // Обновляем сообщения каждые 30 секунд
    refetchOnWindowFocus: true,
    staleTime: 15000, // Данные актуальны 15 секунд
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ conversationId, text }: { conversationId: string; text: string }) => {
      const { data } = await apiClient.post<Message>(`/chats/${conversationId}/send`, { text });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversation', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (conversationId: string) => {
      await apiClient.post(`/chats/${conversationId}/read`);
    },
    onSuccess: (_, conversationId) => {
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversations', 'unread'] });
    },
  });
};

/**
 * Создать или получить диалог с учеником
 */
export const useCreateOrGetConversation = () => {
  return useMutation({
    mutationFn: async (telegramId: number) => {
      const { data } = await apiClient.post<{ conversationId: string }>(
        '/chats/create-or-get',
        { telegramId: String(telegramId) }
      );
      return data.conversationId;
    },
  });
};

// ============ Broadcasts ============
export const useSendBroadcast = () => {
  return useMutation({
    mutationFn: async ({ streamId, message }: { streamId: string; message: string }) => {
      const { data } = await apiClient.post(`/notifications/broadcast`, { 
        streamId, 
        message 
      });
      return data;
    },
  });
};


