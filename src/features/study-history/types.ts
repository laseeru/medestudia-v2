/** Shared domain types for locally stored study history. */

export type Pathway = 'preclinical' | 'clinical';
export type StudyToolId = 'mcq' | 'quiz' | 'explain' | 'chat' | 'stats';
export type ErrorSourceTool = 'mcq' | 'quiz' | 'session' | 'daily-challenge';
export type ErrorStatus = 'unreviewed' | 'reviewing' | 'mastered';

/** Where the learner last did real study work — not merely where they browsed. */
export interface RecentStudyActivity {
  version: 1;
  pathway: Pathway;
  subject?: string;
  rotation?: string;
  system?: string;
  tool: StudyToolId;
  /** Human-readable trail, already localised when written. */
  displayLabel: string;
  /** Route including the query params needed to restore the selection. */
  route: string;
  updatedAt: string;
}

export interface StudyError {
  id: string;
  version: 1;
  createdAt: string;
  lastReviewedAt?: string;
  pathway: Pathway;
  subject: string;
  rotation?: string;
  system?: string;
  sourceTool: ErrorSourceTool;
  question: string;
  options?: string[];
  selectedAnswer?: string;
  correctAnswer: string;
  explanation: string;
  topic?: string;
  status: ErrorStatus;
  incorrectCount: number;
  correctReviewCount: number;
  /** Most recent quick session in which this question was missed, if any. */
  sessionId?: string;
}

/**
 * One answered question. Deliberately separate from `medestudia_scores`, which
 * holds per-quiz aggregates written only by QuickQuiz — reading both would
 * double-count quiz questions and miss standalone MCQs entirely.
 */
export interface StudyEvent {
  version: 1;
  /** Epoch ms. Compared against local day boundaries, so DST-safe. */
  at: number;
  pathway: Pathway;
  subject: string;
  correct: boolean;
  sourceTool: ErrorSourceTool;
  /**
   * Set only for answers given inside a quick session. Summaries filter on it
   * so an MCQ answered in another route — or another browser tab — can never
   * be counted towards a session's result.
   */
  sessionId?: string;
}

export interface WeeklyActivity {
  questions: number;
  correct: number;
  /** Rounded percentage, or null when no questions were answered. */
  accuracy: number | null;
  topics: number;
  pendingErrors: number;
  hasActivity: boolean;
}
