import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import api from '@/lib/api';
import type { Module } from '@/types/modules';

export function useModules() {
  const query = useQuery({
    queryKey: ['portal', 'modules'],
    queryFn: async () => {
      const res = await api.get<Module[]>('/api/portal/modules');
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const stats = useMemo(() => {
    const modules = query.data ?? [];
    const totalEcts = modules.reduce((sum, m) => sum + m.credits, 0);
    const earnedEcts = modules
      .filter((m) => m.status === 'passed')
      .reduce((sum, m) => sum + m.credits, 0);
    const gradedModules = modules.filter((m) => m.grade !== null && m.status === 'passed');
    const averageGrade =
      gradedModules.length > 0
        ? gradedModules.reduce((sum, m) => sum + (m.grade ?? 0), 0) / gradedModules.length
        : null;
    return { totalEcts, earnedEcts, averageGrade };
  }, [query.data]);

  return { ...query, stats };
}
