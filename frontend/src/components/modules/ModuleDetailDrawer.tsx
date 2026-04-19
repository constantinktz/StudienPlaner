import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ModuleStatusBadge } from './ModuleStatusBadge';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getGradeColor, formatDate } from '@/lib/utils';
import type { Module } from '@/types/modules';
import { CheckCircle2, XCircle } from 'lucide-react';

interface Props {
  module: Module | null;
  open: boolean;
  onClose: () => void;
}

export function ModuleDetailDrawer({ module, open, onClose }: Props) {
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" onClose={onClose} className="p-0">
        <SheetHeader className="pb-4">
          <SheetTitle>{module?.name ?? ''}</SheetTitle>
          <SheetDescription>{module?.key}</SheetDescription>
        </SheetHeader>

        {module && (
          <div className="px-6 pb-6 space-y-4">
            <div className="flex flex-wrap gap-2">
              <ModuleStatusBadge status={module.status} />
              {module.isMandatory && (
                <Badge variant="outline">Pflichtmodul</Badge>
              )}
              <Badge variant="secondary">{module.credits} ECTS</Badge>
            </div>

            <Separator />

            <dl className="space-y-3 text-sm">
              {module.grade !== null && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Note</dt>
                  <dd className={`font-semibold ${getGradeColor(module.grade)}`}>
                    {module.grade.toFixed(1)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-gray-500">Versuche</dt>
                <dd>{module.attemptCount}</dd>
              </div>
              {module.semesterTaken !== null && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Abgelegt in Sem.</dt>
                  <dd>{module.semesterTaken}</dd>
                </div>
              )}
              {module.semesterPlanned !== null && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Geplant für Sem.</dt>
                  <dd>{module.semesterPlanned}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-gray-500">Synchronisiert</dt>
                <dd>{formatDate(module.syncedAt)}</dd>
              </div>
            </dl>

            {module.prerequisites.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold mb-2">Voraussetzungen</h4>
                  <ul className="space-y-1">
                    {module.prerequisites.map((prereq) => (
                      <li key={prereq} className="flex items-center gap-2 text-sm">
                        {module.status === 'passed' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-400" />
                        )}
                        {prereq}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
