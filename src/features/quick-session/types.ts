import type { Pathway } from '@/features/study-history/types';

export type SessionDuration = 5 | 10 | 20;
export type SessionGoal = 'review' | 'practice' | 'mixed';

/** A session is an ordered list of steps, each rendered by an existing tool. */
export type SessionStep =
  | { kind: 'explain' }
  | { kind: 'questions'; count: number }
  | { kind: 'summary' };

/** Upper bound for a step's question count; anything larger is corrupt data. */
export const MAX_QUESTIONS_PER_STEP = 20;

/**
 * Schema v2 adds `sessionId` and `completedSteps`.
 *
 * v1 sessions are migrated forward on read rather than discarded, so a learner
 * mid-session across an app update does not silently lose their place.
 */
export interface QuickSession {
  version: 2;
  /** Stable id attached to every answer event produced inside this session. */
  sessionId: string;
  startedAt: number;
  duration: SessionDuration;
  goal: SessionGoal;
  pathway: Pathway;
  /** Translation key for the chosen subject or rotation. */
  areaKey: string;
  steps: SessionStep[];
  currentStep: number;
  /** Indices of steps whose required activity actually finished. */
  completedSteps: number[];
  /**
   * Set on sessions migrated from v1, whose events predate sessionId tagging.
   * Their summary falls back to a time window instead of reporting zero.
   */
  legacyTimeWindow?: boolean;
}
