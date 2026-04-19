import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ScheduleQueryResult } from '@/types/schedule';

export function useMySchedule() {
  return useQuery({
    queryKey: ['schedule', 'mine'],
    queryFn: async () => {
      const res = await api.get<ScheduleQueryResult>('/api/schedule/mine');
      return res.data;
    },
    staleTime: 30 * 60 * 1000,
  });
}
