import { useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg } from '@fullcalendar/core';
import type { ScheduleEvent } from '@/types/schedule';
import { EventCard } from './EventCard';

const TYPE_COLORS: Record<string, string> = {
  Vorlesung: '#3b82f6',
  Labor: '#22c55e',
  Übung: '#eab308',
  Prüfung: '#ef4444',
};

interface Props {
  events: ScheduleEvent[];
  initialDate?: Date;
}

export function WeekView({ events, initialDate }: Props) {
  const calRef = useRef<FullCalendar>(null);
  const [selected, setSelected] = useState<ScheduleEvent | null>(null);
  const [popoverPos, setPopoverPos] = useState({ x: 0, y: 0 });

  const calEvents = events.map((e) => ({
    id: e.id,
    title: e.title,
    start: e.startTime,
    end: e.endTime,
    backgroundColor: TYPE_COLORS[e.eventType] ?? '#6b7280',
    borderColor: TYPE_COLORS[e.eventType] ?? '#6b7280',
    extendedProps: e,
  }));

  const handleEventClick = (info: EventClickArg) => {
    const rect = info.el.getBoundingClientRect();
    setPopoverPos({ x: rect.left, y: rect.bottom + 4 });
    setSelected(info.event.extendedProps as ScheduleEvent);
  };

  return (
    <div className="relative">
      <FullCalendar
        ref={calRef}
        plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        initialDate={initialDate}
        headerToolbar={false}
        slotMinTime="08:00:00"
        slotMaxTime="20:00:00"
        locale="de"
        height="auto"
        events={calEvents}
        eventClick={handleEventClick}
        firstDay={1}
      />

      {selected && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setSelected(null)}
          />
          <div
            className="fixed z-50"
            style={{ left: Math.min(popoverPos.x, window.innerWidth - 300), top: popoverPos.y }}
          >
            <EventCard event={selected} onClose={() => setSelected(null)} />
          </div>
        </>
      )}
    </div>
  );
}
