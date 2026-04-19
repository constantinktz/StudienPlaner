import { useRecommendations } from '@/hooks/useRecommendations';
import { RecommendationCard } from './RecommendationCard';
import { Loader2 } from 'lucide-react';
import type { Recommendation } from '@/types/planner';

const PRIORITY_LABELS: Record<number, string> = {
  2: 'Hoch',
  1: 'Mittel',
  0: 'Niedrig',
};

interface Props {
  maxPriority?: 0 | 1 | 2;
}

export function RecommendationFeed({ maxPriority }: Props) {
  const { active, isLoading } = useRecommendations();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
      </div>
    );
  }

  const filtered = maxPriority !== undefined
    ? active.filter((r) => r.priority >= maxPriority)
    : active;

  if (filtered.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-gray-500">
        Keine Empfehlungen vorhanden 🎉
      </div>
    );
  }

  const grouped: Record<number, Recommendation[]> = { 2: [], 1: [], 0: [] };
  for (const r of filtered) {
    grouped[r.priority].push(r);
  }

  return (
    <div className="space-y-6">
      {([2, 1, 0] as const).map((priority) => {
        const items = grouped[priority];
        if (items.length === 0) return null;
        return (
          <div key={priority}>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
              {PRIORITY_LABELS[priority]} Priorität
            </h3>
            <div className="space-y-2">
              {items.map((r) => (
                <RecommendationCard key={r.id} recommendation={r} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
