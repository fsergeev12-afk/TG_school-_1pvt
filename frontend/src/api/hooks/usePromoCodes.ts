import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import { PromoCode } from '../../types';

export const usePromoCodes = (streamId: string) => {
  return useQuery({
    queryKey: ['promoCodes', streamId],
    queryFn: async () => {
      const { data } = await apiClient.get<PromoCode[]>(`/promo-codes?streamId=${streamId}`);
      return data;
    },
    enabled: !!streamId,
  });
};

export const useCreatePromoCode = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (dto: { 
      streamId: string;
      code: string;
      type: 'free' | 'percent_discount' | 'fixed_discount';
      discountValue?: number;
      maxUsages?: number;
      expiresAt?: string;
      description?: string;
    }) => {
      const { data } = await apiClient.post<PromoCode>('/promo-codes', dto);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['promoCodes', data.streamId] });
    },
  });
};

export const useUpdatePromoCode = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, streamId, ...dto }: { 
      id: string;
      streamId: string;
      maxUsages?: number;
      expiresAt?: string;
      isActive?: boolean;
    }) => {
      const { data } = await apiClient.patch<PromoCode>(`/promo-codes/${id}`, dto);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['promoCodes', variables.streamId] });
    },
  });
};

export const useDeletePromoCode = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, streamId }: { id: string; streamId: string }) => {
      await apiClient.delete(`/promo-codes/${id}`);
      return streamId;
    },
    onSuccess: (streamId) => {
      queryClient.invalidateQueries({ queryKey: ['promoCodes', streamId] });
    },
  });
};

export const useGenerateCode = () => {
  return useMutation({
    mutationFn: async (prefix?: string) => {
      const { data } = await apiClient.get<{ code: string }>(
        `/promo-codes/generate/code${prefix ? `?prefix=${prefix}` : ''}`
      );
      return data.code;
    },
  });
};

// Для студентов
export const useValidatePromoCode = () => {
  return useMutation({
    mutationFn: async ({ code, streamId }: { code: string; streamId: string }) => {
      const { data } = await apiClient.post('/promo-codes/public/validate', { code, streamId });
      return data;
    },
  });
};



