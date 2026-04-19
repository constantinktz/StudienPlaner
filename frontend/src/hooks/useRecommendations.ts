import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import api from '@/lib/api';
import type { Recommendation } from '@/types/planner';

export function useRecommendations() {
  const query = useQuery({
    queryKey: ['planner', 'recommendations'],
    queryFn: async () => {
      const res = await api.get<Recommendation[]>('/api/planner/recommendations');
      return res.data;
    },
  });

  const active = useMemo(() => {
    return (query.data ?? [])
      .filter((r) => !r.isDismissed)
      .sort((a, b) => b.priority - a.priority);
  }, [query.data]);

  return { ...query, active };
}
