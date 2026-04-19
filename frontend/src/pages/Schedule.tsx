import { useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import type { CalendarApi } from '@fullcalendar/core';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useMySchedule } from '@/hooks/useMySchedule';
import { WeekView } from '@/components/schedule/WeekView';
import { ICalExportButton } from '@/components/schedule/ICalExportButton';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

export default function Schedule() {
  const { data, isLoading } = useMySchedule();
  const calRef = useRef<FullCalendar>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const navigate = (dir: 'prev' | 'next' | 'today') => {
    const api: CalendarApi | undefined = calRef.current?.getApi();
    if (dir === 'prev') api?.prev();
    else if (dir === 'next') api?.next();
    else api?.today();
    setCurrentDate(api?.getDate() ?? new Date());
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Stundenplan</h1>
        <ICalExportButton />
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => navigate('prev')}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" onClick={() => navigate('today')}>
          Heute
        </Button>
        <Button variant="outline" size="icon" onClick={() => navigate('next')}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {format(currentDate, 'MMMM yyyy', { locale: de })}
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : !data || data.events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <p className="mb-2 text-lg font-medium">Kein Stundenplan vorhanden</p>
          <p className="text-sm">Bitte Studiengang in den Einstellungen konfigurieren.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <WeekView events={data.events} initialDate={currentDate} />
        </div>
      )}
    </div>
  );
}
