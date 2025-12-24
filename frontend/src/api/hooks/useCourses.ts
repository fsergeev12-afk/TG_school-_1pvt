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

export const useUnpublishCourse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post<Course>(`/courses/${id}/unpublish`);
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
    mutationFn: async ({ blockId, videoUrl, ...dto }: { 
      blockId: string; 
      title: string; 
      description?: string;
      videoType?: string;
      videoUrl?: string;
    }) => {
      const payload = {
        ...dto,
        videoExternalUrl: videoUrl, // Map videoUrl to videoExternalUrl for backend
      };
      const { data } = await apiClient.post<Lesson>(`/blocks/${blockId}/lessons`, payload);
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
    mutationFn: async ({ id, videoUrl, ...dto }: { 
      id: string; 
      title?: string; 
      description?: string; 
      videoType?: string; 
      videoUrl?: string;
    }) => {
      const payload = {
        ...dto,
        videoExternalUrl: videoUrl, // Map videoUrl to videoExternalUrl for backend
      };
      const { data } = await apiClient.patch<Lesson>(`/lessons/${id}`, payload);
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

// ============ Materials ============
export interface LessonMaterial {
  id: string;
  lessonId: string;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  telegramFileId: string;
  displayOrder: number;
  createdAt: string;
}

export interface UploadResult {
  fileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storageType: 'telegram' | 'local';
  url?: string;
}

export const useLessonMaterials = (lessonId: string) => {
  return useQuery({
    queryKey: ['lesson-materials', lessonId],
    queryFn: async () => {
      const { data } = await apiClient.get<LessonMaterial[]>(`/lessons/${lessonId}/materials`);
      return data;
    },
    enabled: !!lessonId,
  });
};

export const useUploadMaterial = () => {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await apiClient.post<UploadResult>('/files/material', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
  });
};

export const useAddMaterial = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ lessonId, fileId, fileName, fileType, fileSizeBytes }: {
      lessonId: string;
      fileId: string;
      fileName: string;
      fileType: string;
      fileSizeBytes: number;
    }) => {
      const { data } = await apiClient.post<LessonMaterial>(`/lessons/${lessonId}/materials`, {
        fileId,
        fileName,
        fileType,
        fileSizeBytes,
      });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lesson-materials', variables.lessonId] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};

export const useGetFileUrl = () => {
  return useMutation({
    mutationFn: async (fileId: string) => {
      const { data } = await apiClient.get<{ url: string }>(`/files/telegram/${fileId}`);
      return data.url;
    },
  });
};

export const useDeleteMaterial = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ lessonId, materialId }: { lessonId: string; materialId: string }) => {
      await apiClient.delete(`/lessons/${lessonId}/materials/${materialId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lesson-materials', variables.lessonId] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};


