import { X, MapPin, User, Clock } from 'lucide-react';
import type { ScheduleEvent } from '@/types/schedule';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';

const TYPE_BADGE: Record<string, 'default' | 'secondary' | 'destructive'> = {
  Vorlesung: 'default',
  Labor: 'secondary',
  Übung: 'secondary',
  Prüfung: 'destructive',
};

interface Props {
  event: ScheduleEvent;
  onClose: () => void;
}

export function EventCard({ event, onClose }: Props) {
  return (
    <Card className="w-72 shadow-xl">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <Badge variant={TYPE_BADGE[event.eventType] ?? 'secondary'} className="mb-1">
              {event.eventType}
            </Badge>
            <CardTitle className="text-base">{event.title}</CardTitle>
          </div>
          <button onClick={onClose} className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <Clock className="h-4 w-4" />
          <span>
            {formatDateTime(event.startTime)} – {new Date(event.endTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        {event.lecturer && (
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <User className="h-4 w-4" />
            <span>{event.lecturer}</span>
          </div>
        )}
        {event.room && (
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <MapPin className="h-4 w-4" />
            <span>{event.room}</span>
          </div>
        )}
        {event.studentGroup && (
          <div className="text-gray-500">Gruppe: {event.studentGroup}</div>
        )}
      </CardContent>
    </Card>
  );
}
