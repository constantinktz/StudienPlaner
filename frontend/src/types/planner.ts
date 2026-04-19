export type RecommendationType =
  | 'pullForward'
  | 'retryNow'
  | 'retryLater'
  | 'missingMandatory'
  | 'overloadWarning'
  | 'underloadWarning';

export interface Recommendation {
  id: string;
  type: RecommendationType;
  moduleKey: string | null;
  moduleName: string | null;
  message: string;
  priority: 0 | 1 | 2;
  isDismissed: boolean;
  generatedAt: string;
}

export interface StudyPlanEntry {
  id: string;
  moduleKey: string;
  moduleName: string;
  plannedSemester: number;
  isRecommended: boolean;
  recommendationReason: string | null;
}
