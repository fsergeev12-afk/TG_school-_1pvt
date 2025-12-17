import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import { Payment, PaymentStats } from '../../types';

export const usePaymentStats = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: ['payments', 'stats', startDate, endDate],
    queryFn: async () => {
      let url = '/payments/stats';
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (params.toString()) url += `?${params.toString()}`;
      
      const { data } = await apiClient.get<PaymentStats>(url);
      return data;
    },
  });
};

export const useStreamPaymentStats = (streamId: string) => {
  return useQuery({
    queryKey: ['payments', 'stream', streamId, 'stats'],
    queryFn: async () => {
      const { data } = await apiClient.get<PaymentStats>(`/payments/stream/${streamId}/stats`);
      return data;
    },
    enabled: !!streamId,
  });
};

export const useStreamPayments = (streamId: string) => {
  return useQuery({
    queryKey: ['payments', 'stream', streamId],
    queryFn: async () => {
      const { data } = await apiClient.get<Payment[]>(`/payments/stream/${streamId}`);
      return data;
    },
    enabled: !!streamId,
  });
};

export const useManualConfirmPayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ streamId, studentId, comment }: { 
      streamId: string; 
      studentId: string;
      comment?: string;
    }) => {
      const { data } = await apiClient.post(`/payments/stream/${streamId}/confirm`, { 
        studentId, 
        comment 
      });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payments', 'stream', variables.streamId] });
      queryClient.invalidateQueries({ queryKey: ['stream', variables.streamId, 'students'] });
    },
  });
};

// Для студентов
export const useInitPayment = () => {
  return useMutation({
    mutationFn: async ({ streamId, promoCode }: { streamId: string; promoCode?: string }) => {
      const { data } = await apiClient.post('/payments/public/init', { streamId, promoCode });
      return data;
    },
  });
};

