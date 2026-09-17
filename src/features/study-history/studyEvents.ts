import type { StudyError, StudyEvent, WeeklyActivity } from './types';
import {
  RETENTION,
  STORAGE_KEYS,
  isRecord,
  parseArray,
  readJson,
  startOfLocalDay,
  writeJson,
} from './storage';
import { countPendingErrors } from './studyErrors';

export interface SessionResults {
  answered: number;
  correct: number;
  /** Null rather than 0% when nothing was answered. */
  accuracy: number | null;
  mistakes: number;
}

/**
 * Results for one quick session.
 *
 * Matching on sessionId rather than a time window is what stops an answer
 * given in another route or another tab from inflating the summary. Sessions
 * migrated from schema v1 have no tagged events, so they fall back to the
 * original time-window behaviour rather than reporting a false zero.
 */
export function summariseSession(
  events: StudyEvent[],
  session: { sessionId: string; startedAt: number; legacyTimeWindow?: boolean },
): SessionResults {
  const mine = session.legacyTimeWindow
    ? events.filter((e) => e.at >= session.startedAt)
    : events.filter((e) => e.sessionId === session.sessionId);

  const answered = mine.length;
  const correct = mine.filter((e) => e.correct).length;
  return {
    answered,
    correct,
    accuracy: answered > 0 ? Math.round((correct / answered) * 100) : null,
    mistakes: answered - correct,
  };
}

export function parseStudyEvent(value: unknown): StudyEvent | null {
  if (!isRecord(value)) return null;
  if (value.version !== 1) return null;
  if (typeof value.at !== 'number' || !Number.isFinite(value.at)) return null;
  return {
    version: 1,
    at: value.at,
    pathway: value.pathway === 'clinical' ? 'clinical' : 'preclinical',
    subject: typeof value.subject === 'string' ? value.subject : '—',
    correct: value.correct === true,
    sourceTool:
      value.sourceTool === 'mcq' ||
      value.sourceTool === 'session' ||
      value.sourceTool === 'daily-challenge'
        ? value.sourceTool
        : 'quiz',
    sessionId: typeof value.sessionId === 'string' && value.sessionId ? value.sessionId : undefined,
  };
}

export function loadStudyEvents(): StudyEvent[] {
  return readJson(STORAGE_KEYS.studyEvents, (v) => parseArray(v, parseStudyEvent)) ?? [];
}

export function appendStudyEvent(events: StudyEvent[], event: Omit<StudyEvent, 'version'>): StudyEvent[] {
  const next = [...events, { ...event, version: 1 as const }];
  // Bounded retention: drop the oldest beyond the cap.
  return next.length > RETENTION.maxEvents ? next.slice(next.length - RETENTION.maxEvents) : next;
}

export function saveStudyEvents(events: StudyEvent[]): void {
  writeJson(STORAGE_KEYS.studyEvents, events);
}

/**
 * Rolling seven local days, inclusive of today.
 *
 * Uses local midnight boundaries rather than a fixed 7×24h subtraction so the
 * window stays correct across DST changes and timezone travel.
 */
export function summariseWeek(
  events: StudyEvent[],
  errors: StudyError[],
  now: Date = new Date(),
): WeeklyActivity {
  const since = startOfLocalDay(6, now);
  const recent = events.filter((e) => e.at >= since);
  const questions = recent.length;
  const correct = recent.filter((e) => e.correct).length;
  const topics = new Set(recent.map((e) => e.subject)).size;

  return {
    questions,
    correct,
    accuracy: questions > 0 ? Math.round((correct / questions) * 100) : null,
    topics,
    pendingErrors: countPendingErrors(errors),
    hasActivity: questions > 0,
  };
}
