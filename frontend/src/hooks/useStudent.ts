import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  StudentMeResponse, Achievement, Feedback, Rankings, AchievementType,
  StudentPublicProfile, PublicRatingRow, StudentBadge, ScoreHistoryPoint,
} from '@/types/student';

export function useBadgeCatalog() {
  return useQuery<StudentBadge[]>({
    queryKey: ['badges', 'catalog'],
    queryFn: () => api.get('/public/badges/catalog').then(r => r.data),
    staleTime: 5 * 60_000,
  });
}

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

export function usePublicRating() {
  return useQuery<PublicRatingRow[]>({
    queryKey: ['public', 'rating'],
    queryFn: () => api.get('/public/rating').then(r => r.data),
    staleTime: 30_000,
  });
}

export function useStudentPublic(studentId: string) {
  return useQuery<StudentPublicProfile>({
    queryKey: ['student', 'public', studentId],
    queryFn: () => api.get(`/students/${studentId}/public`).then(r => r.data),
    enabled: !!studentId,
  });
}

export function useStudentBadges() {
  return useQuery<{ earned: StudentBadge[]; pinnedSlug: string | null }>({
    queryKey: ['student', 'badges'],
    queryFn: () => api.get('/students/me/badges').then(r => r.data),
    staleTime: 60_000,
  });
}

export function useUpdateProfilePublic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (profilePublic: boolean) =>
      api.put('/students/me/profile-public', { profilePublic }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student', 'me'] });
      qc.invalidateQueries({ queryKey: ['public', 'rating'] });
    },
  });
}

export function usePinBadge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slug: string | null) =>
      api.put('/students/me/pinned-badge', { slug }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student', 'badges'] });
      qc.invalidateQueries({ queryKey: ['student', 'me'] });
    },
  });
}

export function useScoreHistory() {
  return useQuery<ScoreHistoryPoint[]>({
    queryKey: ['student', 'score-history'],
    queryFn: () => api.get('/students/me/score-history').then(r => r.data),
    staleTime: 60_000,
  });
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
