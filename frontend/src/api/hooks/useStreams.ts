import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import { Stream, StreamStudent, LessonSchedule, StudentStats } from '../../types';

// ============ Streams ============
export const useStreams = () => {
  return useQuery({
    queryKey: ['streams'],
    queryFn: async () => {
      const { data } = await apiClient.get<Stream[]>('/streams');
      return data;
    },
  });
};

export const useStreamsByCourse = (courseId: string) => {
  return useQuery({
    queryKey: ['streams', 'course', courseId],
    queryFn: async () => {
      const { data } = await apiClient.get<Stream[]>(`/streams/course/${courseId}`);
      return data;
    },
    enabled: !!courseId,
  });
};

export const useStream = (id: string) => {
  return useQuery({
    queryKey: ['stream', id],
    queryFn: async () => {
      const { data } = await apiClient.get<Stream>(`/streams/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateStream = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (dto: { 
      courseId: string; 
      name: string; 
      description?: string;
      price?: number;
      scheduleEnabled?: boolean;
      lessonSchedules?: { lessonId: string; scheduledOpenAt: string }[];
    }) => {
      const { data } = await apiClient.post<Stream>('/streams', dto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streams'] });
    },
  });
};

export const useUpdateStream = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...dto }: { 
      id: string; 
      name?: string;
      description?: string;
      price?: number;
      isActive?: boolean;
    }) => {
      const { data } = await apiClient.patch<Stream>(`/streams/${id}`, dto);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['streams'] });
      queryClient.invalidateQueries({ queryKey: ['stream', data.id] });
    },
  });
};

export const useDeleteStream = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/streams/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streams'] });
    },
  });
};

export const useCloneStream = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name?: string }) => {
      const { data } = await apiClient.post<Stream>(`/streams/${id}/clone`, { name });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streams'] });
    },
  });
};

export const useOpenAllLessons = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (streamId: string) => {
      const { data } = await apiClient.post<{ success: boolean; openedCount: number }>(
        `/streams/${streamId}/open-all-lessons`
      );
      return data;
    },
    onSuccess: (_, streamId) => {
      queryClient.invalidateQueries({ queryKey: ['stream', streamId] });
      queryClient.invalidateQueries({ queryKey: ['stream', streamId, 'schedule'] });
    },
  });
};

// ============ Students ============
export const useStreamStudents = (streamId: string) => {
  return useQuery({
    queryKey: ['stream', streamId, 'students'],
    queryFn: async () => {
      const { data } = await apiClient.get<StreamStudent[]>(`/streams/${streamId}/students`);
      return data;
    },
    enabled: !!streamId,
    // Автоматическое обновление каждые 10 секунд
    refetchInterval: 10000,
    // Обновлять при возвращении на вкладку
    refetchOnWindowFocus: true,
    // Данные считаются актуальными 5 секунд
    staleTime: 5000,
  });
};

export const useStudentStats = (streamId: string) => {
  return useQuery({
    queryKey: ['stream', streamId, 'students', 'stats'],
    queryFn: async () => {
      const { data } = await apiClient.get<StudentStats>(`/streams/${streamId}/students/stats`);
      return data;
    },
    enabled: !!streamId,
  });
};

export const useAddStudent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ streamId, telegramId, ...rest }: { 
      streamId: string; 
      telegramId: number;
      telegramUsername?: string;
      telegramFirstName?: string;
    }) => {
      const { data } = await apiClient.post<StreamStudent>(
        `/streams/${streamId}/students`, 
        { telegramId, ...rest }
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['stream', variables.streamId, 'students'] });
    },
  });
};

export const useMarkStudentPaid = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ streamId, studentId }: { streamId: string; studentId: string }) => {
      const { data } = await apiClient.post(`/streams/${streamId}/students/${studentId}/paid`);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['stream', variables.streamId, 'students'] });
    },
  });
};

export const useRemoveStudent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ streamId, studentId }: { streamId: string; studentId: string }) => {
      await apiClient.delete(`/streams/${streamId}/students/${studentId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['stream', variables.streamId, 'students'] });
    },
  });
};

// ============ Schedule ============
export const useStreamSchedule = (streamId: string) => {
  return useQuery({
    queryKey: ['stream', streamId, 'schedule'],
    queryFn: async () => {
      const { data } = await apiClient.get<LessonSchedule[]>(`/streams/${streamId}/schedule`);
      return data;
    },
    enabled: !!streamId,
  });
};

export const useCreateSchedule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ streamId, schedules }: { 
      streamId: string; 
      schedules: { lessonId: string; scheduledOpenAt: string }[];
    }) => {
      const { data } = await apiClient.post(`/streams/${streamId}/schedule`, { schedules });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['stream', variables.streamId, 'schedule'] });
    },
  });
};

export const useAutoSchedule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ streamId, startDate, intervalDays }: { 
      streamId: string; 
      startDate: string;
      intervalDays?: number;
    }) => {
      const { data } = await apiClient.post(`/streams/${streamId}/schedule/auto`, { 
        startDate, 
        intervalDays 
      });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['stream', variables.streamId, 'schedule'] });
    },
  });
};


