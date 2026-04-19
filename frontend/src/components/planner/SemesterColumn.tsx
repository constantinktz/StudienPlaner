import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { StudyPlanEntry } from '@/types/planner';
import { PlannerCard } from './PlannerCard';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  semester: number;
  entries: StudyPlanEntry[];
  onAdd?: (semester: number) => void;
}

function getEctsColor(ects: number): string {
  if (ects < 18) return 'text-red-600';
  if (ects <= 30) return 'text-green-600';
  return 'text-orange-500';
}

export function SemesterColumn({ semester, entries, onAdd }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: `semester-${semester}` });
  const totalEcts = entries.reduce((sum) => {
    // approximate — real data would come from modules
    return sum;
  }, 0);

  const ids = entries.map((e) => e.id);

  return (
    <div className="flex w-60 flex-shrink-0 flex-col rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
      {/* Header */}
      <div className="flex items-center justify-between rounded-t-lg px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <span className="font-semibold text-sm">Semester {semester}</span>
        <div className="flex items-center gap-2">
          <span className={cn('text-xs font-medium', getEctsColor(totalEcts))}>
            {totalEcts} ECTS
          </span>
          {onAdd && (
            <button
              onClick={() => onAdd(semester)}
              className="rounded p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 space-y-2 p-3 min-h-[120px] transition-colors rounded-b-lg',
          isOver && 'bg-blue-50 dark:bg-blue-900/20'
        )}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {entries.map((entry) => (
            <PlannerCard key={entry.id} entry={entry} />
          ))}
        </SortableContext>
        {entries.length === 0 && (
          <div className="flex h-16 items-center justify-center rounded border-2 border-dashed border-gray-300 dark:border-gray-600">
            <span className="text-xs text-gray-400">Modul ablegen</span>
          </div>
        )}
      </div>
    </div>
  );
}
