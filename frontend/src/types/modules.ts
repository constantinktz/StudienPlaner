export type ModuleStatus = 'open' | 'enrolled' | 'passed' | 'failed' | 'planned';

export interface Module {
  key: string;
  name: string;
  credits: number;
  status: ModuleStatus;
  grade: number | null;
  semesterPlanned: number | null;
  semesterTaken: number | null;
  attemptCount: number;
  isMandatory: boolean;
  prerequisites: string[];
  syncedAt: string;
}

export interface ModuleSyncResult {
  totalModules: number;
  passedModules: number;
  failedModules: number;
  enrolledModules: number;
  totalEcts: number;
  earnedEcts: number;
  syncedAt: string;
}
