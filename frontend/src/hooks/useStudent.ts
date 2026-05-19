import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { StudentMeResponse, Achievement, Feedback, Rankings, AchievementType } from '@/types/student';

export function useStudentMe() {
  return useQuery<StudentMeResponse>({
    queryKey: ['student', 'me'],
    queryFn: () => api.get('/students/me').then(r => r.data),
  });
}

export function useStudentRankings() {
  return useQuery<Rankings>({
    queryKey: ['student', 'rankings'],
    queryFn: () => api.get('/students/me/rankings').then(r => r.data),
  });
}

export function useAchievements() {
  return useQuery<Achievement[]>({
    queryKey: ['student', 'achievements'],
    queryFn: () => api.get('/students/me/achievements').then(r => r.data),
  });
}

export function useFeedbacks() {
  return useQuery<Feedback[]>({
    queryKey: ['student', 'feedbacks'],
    queryFn: () => api.get('/students/me/feedbacks').then(r => r.data),
  });
}

export interface CreateAchievementInput {
  type: AchievementType;
  title: string;
  description?: string;
  file?: File;
  fileUrl?: string;
}

export function useCreateAchievement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAchievementInput) => {
      const form = new FormData();
      form.append('type', data.type);
      form.append('title', data.title);
      if (data.description) form.append('description', data.description);
      if (data.file) form.append('file', data.file);
      else if (data.fileUrl) form.append('fileUrl', data.fileUrl);
      // Don't set Content-Type manually — Axios auto-adds multipart boundary for FormData
      return api.post('/students/me/achievements', form).then(r => r.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['student', 'achievements'] }),
  });
}
