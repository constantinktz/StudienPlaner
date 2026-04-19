import type { Recommendation, RecommendationType } from '@/types/planner';
import { Card, CardContent } from '@/components/ui/card';
import api from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { toast } from 'sonner';
import { X } from 'lucide-react';

const TYPE_ICON: Record<RecommendationType, string> = {
  pullForward: '📈',
  retryNow: '⚠️',
  retryLater: '🔴',
  missingMandatory: '🚨',
  overloadWarning: '⚡',
  underloadWarning: '📊',
};

const TYPE_LABEL: Record<RecommendationType, string> = {
  pullForward: 'Vorgezogen',
  retryNow: 'Jetzt wiederholen',
  retryLater: 'Später wiederholen',
  missingMandatory: 'Pflichtmodul fehlt',
  overloadWarning: 'Überlastung',
  underloadWarning: 'Unterlastung',
};

interface Props {
  recommendation: Recommendation;
}

export function RecommendationCard({ recommendation: r }: Props) {
  const handleDismiss = async () => {
    try {
      await api.patch(`/api/planner/recommendations/${r.id}/dismiss`);
      queryClient.invalidateQueries({ queryKey: ['planner', 'recommendations'] });
    } catch {
      toast.error('Fehler beim Verwerfen');
    }
  };

  return (
    <Card className="relative">
      <CardContent className="pt-4 pb-3">
        <div className="flex items-start gap-3">
          <span className="text-xl leading-none">{TYPE_ICON[r.type]}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {TYPE_LABEL[r.type]}
              </span>
              {r.moduleName && (
                <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                  — {r.moduleName}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">{r.message}</p>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 rounded p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Verwerfen"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
