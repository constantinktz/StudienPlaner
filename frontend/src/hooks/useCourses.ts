import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { CourseOfStudy } from '@/types/schedule';

export function useCourses() {
  return useQuery({
    queryKey: ['schedule', 'courses'],
    queryFn: async () => {
      const res = await api.get<CourseOfStudy[]>('/api/schedule/courses');
      return res.data;
    },
    staleTime: 60 * 60 * 1000,
  });
}
