import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';

// Типы для студенческого курса
export interface StudentLesson {
  id: string;
  title: string;
  description?: string | null;
  videoType?: 'telegram' | 'external' | null;
  available: boolean;
  scheduledAt: string | null;
}

export interface StudentBlock {
  id: string;
  title: string;
  order: number;
  lessons: StudentLesson[];
}

export interface StudentCourse {
  id: string;
  title: string;
  description?: string;
  coverImageUrl?: string;
  creatorName: string;
  streamId: string;
  streamName: string;
  price: number;
  requiresPayment: boolean;
  isPaid: boolean;
  totalLessons?: number;
  availableLessons?: number;
  allAvailable?: boolean;
  blocks: StudentBlock[];
}

export interface StudentCourseListItem {
  id: string;
  title: string;
  description?: string;
  coverImageUrl?: string;
  creatorName: string;
  streamId: string;
  streamName?: string;
  price?: number;
  requiresPayment: boolean;
  isPaid: boolean;
  accessToken: string;
}

export interface StudentLessonDetail {
  id: string;
  title: string;
  description?: string;
  blockTitle?: string; // Название блока для навигации
  videoType?: 'telegram' | 'external' | null;
  videoExternalUrl?: string;
  videoTelegramFileId?: string;
  materials: {
    id: string;
    fileName: string;
    fileType: string;
    fileSizeBytes: number;
    telegramFileId?: string;
  }[];
  prevLessonId: string | null;
  nextLessonId: string | null;
}

/**
 * Получить список всех курсов студента
 */
export function useStudentCourses() {
  return useQuery<StudentCourseListItem[]>({
    queryKey: ['studentCourses'],
    queryFn: async () => {
      const response = await apiClient.get('/student/courses');
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 минут
    retry: false,
  });
}

/**
 * Получить курс студента
 */
export function useStudentCourse() {
  return useQuery<StudentCourse>({
    queryKey: ['studentCourse'],
    queryFn: async () => {
      const response = await apiClient.get('/student/course');
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 минут
    retry: false,
  });
}

/**
 * Получить урок студента
 */
export function useStudentLesson(lessonId: string | undefined) {
  return useQuery<StudentLessonDetail>({
    queryKey: ['studentLesson', lessonId],
    queryFn: async () => {
      const response = await apiClient.get(`/student/lessons/${lessonId}`);
      return response.data;
    },
    enabled: !!lessonId,
    staleTime: 1000 * 60 * 5, // 5 минут
  });
}

/**
 * Активировать доступ по токену
 */
export function useActivateAccess() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (accessToken: string) => {
      const response = await apiClient.post('/students/activate', { accessToken });
      return response.data;
    },
    onSuccess: () => {
      // Обновить данные курса после активации
      queryClient.invalidateQueries({ queryKey: ['studentCourse'] });
    },
  });
}

/**
 * Проверить токен доступа (без активации)
 */
export function useCheckAccessToken(accessToken: string | null, telegramId?: number) {
  return useQuery({
    queryKey: ['checkAccessToken', accessToken, telegramId],
    queryFn: async () => {
      const response = await apiClient.get(`/students/check/${accessToken}`, {
        params: { telegramId },
      });
      return response.data;
    },
    enabled: !!accessToken,
    staleTime: 1000 * 60 * 10, // 10 минут
  });
}

