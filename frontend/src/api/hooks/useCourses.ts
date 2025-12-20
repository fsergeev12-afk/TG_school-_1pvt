import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import { Course, Block, Lesson } from '../../types';

// ============ Courses ============
export const useCourses = () => {
  return useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data } = await apiClient.get<Course[]>('/courses');
      return data;
    },
  });
};

export const useCourse = (id: string) => {
  return useQuery({
    queryKey: ['course', id],
    queryFn: async () => {
      const { data } = await apiClient.get<Course>(`/courses/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateCourse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (dto: { title: string; description?: string }) => {
      const { data } = await apiClient.post<Course>('/courses', dto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};

export const useUpdateCourse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...dto }: { id: string; title?: string; description?: string }) => {
      const { data } = await apiClient.patch<Course>(`/courses/${id}`, dto);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['course', data.id] });
    },
  });
};

export const useDeleteCourse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/courses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};

export const usePublishCourse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post<Course>(`/courses/${id}/publish`);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['course', data.id] });
    },
  });
};

// ============ Blocks ============
export const useCreateBlock = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ courseId, title }: { courseId: string; title: string }) => {
      const { data } = await apiClient.post<Block>(`/courses/${courseId}/blocks`, { title });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course', variables.courseId] });
    },
  });
};

export const useUpdateBlock = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const { data } = await apiClient.patch<Block>(`/blocks/${id}`, { title });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};

export const useDeleteBlock = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/blocks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};

export const useReorderBlocks = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ courseId, orderedIds }: { courseId: string; orderedIds: string[] }) => {
      const { data } = await apiClient.patch(`/courses/${courseId}/blocks/reorder`, { orderedIds });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};

// ============ Lessons ============
export const useCreateLesson = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ blockId, ...dto }: { blockId: string; title: string; description?: string }) => {
      const { data } = await apiClient.post<Lesson>(`/blocks/${blockId}/lessons`, dto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};

export const useUpdateLesson = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...dto }: { id: string; title?: string; description?: string; videoType?: string; videoTelegramFileId?: string; videoExternalUrl?: string }) => {
      const { data } = await apiClient.patch<Lesson>(`/lessons/${id}`, dto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};

export const useDeleteLesson = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/lessons/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};

export const useReorderLessons = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ blockId, orderedIds }: { blockId: string; orderedIds: string[] }) => {
      const { data } = await apiClient.patch(`/blocks/${blockId}/lessons/reorder`, { orderedIds });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};


