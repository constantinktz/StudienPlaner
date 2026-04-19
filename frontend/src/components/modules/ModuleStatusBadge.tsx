import type { ModuleStatus } from '@/types/modules';
import { getStatusColor } from '@/lib/utils';
import { cn } from '@/lib/utils';

const STATUS_LABELS: Record<ModuleStatus, string> = {
  open: 'Offen',
  enrolled: 'Eingeschrieben',
  passed: 'Bestanden',
  failed: 'Nicht bestanden',
  planned: 'Geplant',
};

interface Props {
  status: ModuleStatus;
  className?: string;
}

export function ModuleStatusBadge({ status, className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        getStatusColor(status),
        className
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
