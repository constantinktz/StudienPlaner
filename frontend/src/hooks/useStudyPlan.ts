import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import api from '@/lib/api';
import type { StudyPlanEntry } from '@/types/planner';

export function useStudyPlan() {
  const query = useQuery({
    queryKey: ['planner', 'studyplan'],
    queryFn: async () => {
      const res = await api.get<StudyPlanEntry[]>('/api/planner/studyplan');
      return res.data;
    },
  });

  const bySemester = useMemo(() => {
    const map = new Map<number, StudyPlanEntry[]>();
    for (const entry of query.data ?? []) {
      const existing = map.get(entry.plannedSemester) ?? [];
      map.set(entry.plannedSemester, [...existing, entry]);
    }
    return map;
  }, [query.data]);

  return { ...query, bySemester };
}
