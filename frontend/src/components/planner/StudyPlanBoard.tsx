import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useStudyPlan } from '@/hooks/useStudyPlan';
import { SemesterColumn } from './SemesterColumn';
import { PlannerCard } from './PlannerCard';
import type { StudyPlanEntry } from '@/types/planner';
import api from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export function StudyPlanBoard() {
  const { data, isLoading, bySemester } = useStudyPlan();
  const [activeEntry, setActiveEntry] = useState<StudyPlanEntry | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <p className="mb-2 text-lg font-medium">Noch kein Studienplan vorhanden</p>
        <p className="text-sm">Starte eine Analyse um Empfehlungen zu erhalten.</p>
      </div>
    );
  }

  const maxSemester = Math.max(...Array.from(bySemester.keys()), 0);
  const semesterCount = maxSemester + 2;
  const semesters = Array.from({ length: semesterCount }, (_, i) => i + 1);

  const handleDragStart = (event: DragStartEvent) => {
    const entry = data.find((e) => e.id === event.active.id);
    setActiveEntry(entry ?? null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveEntry(null);
    if (!over) return;

    // Determine target semester from over container id (semester-X) or sibling entry
    let targetSemester: number | null = null;
    const overIdStr = String(over.id);
    if (overIdStr.startsWith('semester-')) {
      targetSemester = parseInt(overIdStr.replace('semester-', ''), 10);
    } else {
      // over is another entry — find its semester
      const overEntry = data.find((e) => e.id === over.id);
      targetSemester = overEntry?.plannedSemester ?? null;
    }

    if (targetSemester === null || active.id === over.id) return;

    const entry = data.find((e) => e.id === active.id);
    if (!entry) return;
    if (entry.plannedSemester === targetSemester) return;

    try {
      await api.patch(`/api/planner/studyplan/${entry.id}`, { plannedSemester: targetSemester });
      queryClient.invalidateQueries({ queryKey: ['planner', 'studyplan'] });
    } catch {
      toast.error('Fehler beim Verschieben des Moduls');
    }
  };

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {semesters.map((sem) => (
          <SemesterColumn
            key={sem}
            semester={sem}
            entries={bySemester.get(sem) ?? []}
          />
        ))}
      </div>

      <DragOverlay>
        {activeEntry && <PlannerCard entry={activeEntry} />}
      </DragOverlay>
    </DndContext>
  );
}
