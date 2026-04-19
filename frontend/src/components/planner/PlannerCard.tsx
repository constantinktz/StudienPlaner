import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { StudyPlanEntry } from '@/types/planner';
import { ModuleStatusBadge } from '@/components/modules/ModuleStatusBadge';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  entry: StudyPlanEntry;
  moduleStatus?: string;
}

export function PlannerCard({ entry, moduleStatus }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: entry.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'rounded-md border bg-white p-3 shadow-sm dark:bg-gray-800 cursor-grab active:cursor-grabbing',
        entry.isRecommended && 'border-blue-400',
        isDragging && 'opacity-50 shadow-lg',
        !entry.isRecommended && 'border-gray-200 dark:border-gray-700'
      )}
      {...attributes}
    >
      <div className="flex items-start gap-2">
        <span {...listeners} className="mt-0.5 cursor-grab text-gray-400">
          <GripVertical className="h-4 w-4" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-1">
            {entry.isRecommended && <TrendingUp className="h-3 w-3 text-blue-500 flex-shrink-0" />}
            <span className="text-sm font-medium truncate">{entry.moduleName}</span>
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            <Badge variant="secondary" className="text-xs">{entry.moduleKey}</Badge>
            {moduleStatus && (
              <ModuleStatusBadge status={moduleStatus as any} className="text-xs" />
            )}
          </div>
          {entry.recommendationReason && (
            <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
              {entry.recommendationReason}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
