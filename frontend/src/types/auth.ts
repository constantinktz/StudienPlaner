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

export interface AuthResponse {
  userId: string;
  email: string;
  accessToken: string;
}
