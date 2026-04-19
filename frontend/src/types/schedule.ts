export interface CourseOfStudy {
  key: string;
  name: string;
  availableSemesters: string[];
}

export interface ScheduleEvent {
  id: string;
  title: string;
  eventType: 'Vorlesung' | 'Labor' | 'Übung' | 'Prüfung';
  lecturer: string | null;
  room: string | null;
  startTime: string;
  endTime: string;
  studentGroup: string | null;
}

export interface ScheduleQueryResult {
  courseKey: string;
  semester: number;
  events: ScheduleEvent[];
}
