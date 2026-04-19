export interface UserProfile {
  id: string;
  email: string;
  matrikelNumber: string;
  courseKey: string | null;
  currentSemester: number | null;
  studentGroup: string | null;
  portalConnected: boolean;
  createdAt: string;
}
