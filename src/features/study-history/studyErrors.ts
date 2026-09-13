import type { ErrorSourceTool, ErrorStatus, Pathway, StudyError } from './types';
import {
  RETENTION,
  STORAGE_KEYS,
  isNonEmptyString,
  isRecord,
  normalizeQuestion,
  parseArray,
  readJson,
  writeJson,
} from './storage';

const STATUSES: ErrorStatus[] = ['unreviewed', 'reviewing', 'mastered'];
const SOURCES: ErrorSourceTool[] = ['mcq', 'quiz', 'session', 'daily-challenge'];

export function parseStudyError(value: unknown): StudyError | null {
  if (!isRecord(value)) return null;
  if (value.version !== 1) return null;
  if (!isNonEmptyString(value.id)) return null;
  if (!isNonEmptyString(value.question)) return null;
  if (!isNonEmptyString(value.correctAnswer)) return null;
  if (!STATUSES.includes(value.status as ErrorStatus)) return null;

  return {
    id: value.id,
    version: 1,
    createdAt: isNonEmptyString(value.createdAt) ? value.createdAt : new Date().toISOString(),
    lastReviewedAt: isNonEmptyString(value.lastReviewedAt) ? value.lastReviewedAt : undefined,
    pathway: value.pathway === 'clinical' ? 'clinical' : 'preclinical',
    subject: isNonEmptyString(value.subject) ? value.subject : '—',
    rotation: isNonEmptyString(value.rotation) ? value.rotation : undefined,
    system: isNonEmptyString(value.system) ? value.system : undefined,
    sourceTool: SOURCES.includes(value.sourceTool as ErrorSourceTool)
      ? (value.sourceTool as ErrorSourceTool)
      : 'quiz',
    question: value.question,
    options: Array.isArray(value.options)
      ? value.options.filter(isNonEmptyString)
      : undefined,
    selectedAnswer: isNonEmptyString(value.selectedAnswer) ? value.selectedAnswer : undefined,
    correctAnswer: value.correctAnswer,
    explanation: isNonEmptyString(value.explanation) ? value.explanation : '',
    topic: isNonEmptyString(value.topic) ? value.topic : undefined,
    status: value.status as ErrorStatus,
    incorrectCount: typeof value.incorrectCount === 'number' && value.incorrectCount > 0
      ? Math.floor(value.incorrectCount)
      : 1,
    correctReviewCount: typeof value.correctReviewCount === 'number' && value.correctReviewCount > 0
      ? Math.floor(value.correctReviewCount)
      : 0,
    sessionId: isNonEmptyString(value.sessionId) ? value.sessionId : undefined,
  };
}

export function loadStudyErrors(): StudyError[] {
  return readJson(STORAGE_KEYS.studyErrors, (v) => parseArray(v, parseStudyError)) ?? [];
}

export function saveStudyErrors(errors: StudyError[]): void {
  // Bounded retention: keep the most recently created entries.
  const bounded = errors
    .slice()
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, RETENTION.maxErrors);
  writeJson(STORAGE_KEYS.studyErrors, bounded);
}

export interface NewStudyError {
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
  sessionId?: string;
}

/**
 * Adds a missed question, or bumps the counter when the same question is
 * missed again. Duplicate detection normalises the question text, so the same
 * item re-worded by whitespace or accents does not create a second entry.
 *
 * A question previously marked `mastered` reopens as `reviewing` — getting it
 * wrong again is exactly the signal that mastery did not hold.
 */
export function upsertStudyError(errors: StudyError[], input: NewStudyError): StudyError[] {
  const fingerprint = normalizeQuestion(input.question);
  const existingIndex = errors.findIndex(
    (e) => normalizeQuestion(e.question) === fingerprint,
  );

  if (existingIndex >= 0) {
    const existing = errors[existingIndex];
    const updated: StudyError = {
      ...existing,
      incorrectCount: existing.incorrectCount + 1,
      status: existing.status === 'mastered' ? 'reviewing' : existing.status,
      // Refresh the explanation in case the newer one is better.
      explanation: input.explanation || existing.explanation,
      selectedAnswer: input.selectedAnswer ?? existing.selectedAnswer,
      // Point at the most recent session that missed it, so that session's
      // "review these mistakes" link still finds a repeat offender.
      sessionId: input.sessionId ?? existing.sessionId,
    };
    const next = errors.slice();
    next[existingIndex] = updated;
    return next;
  }

  const created: StudyError = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    version: 1,
    createdAt: new Date().toISOString(),
    pathway: input.pathway,
    subject: input.subject,
    rotation: input.rotation,
    system: input.system,
    sourceTool: input.sourceTool,
    question: input.question,
    options: input.options,
    selectedAnswer: input.selectedAnswer,
    correctAnswer: input.correctAnswer,
    explanation: input.explanation,
    topic: input.topic,
    status: 'unreviewed',
    incorrectCount: 1,
    correctReviewCount: 0,
    sessionId: input.sessionId,
  };
  return [created, ...errors];
}

/** A correct retry advances the entry; two correct reviews mark it mastered. */
export function recordErrorReview(
  errors: StudyError[],
  id: string,
  wasCorrect: boolean,
): StudyError[] {
  return errors.map((e) => {
    if (e.id !== id) return e;
    if (!wasCorrect) {
      return { ...e, status: 'reviewing', incorrectCount: e.incorrectCount + 1, lastReviewedAt: new Date().toISOString() };
    }
    const correctReviewCount = e.correctReviewCount + 1;
    return {
      ...e,
      correctReviewCount,
      status: correctReviewCount >= 2 ? 'mastered' : 'reviewing',
      lastReviewedAt: new Date().toISOString(),
    };
  });
}

export function setErrorStatus(errors: StudyError[], id: string, status: ErrorStatus): StudyError[] {
  return errors.map((e) =>
    e.id === id ? { ...e, status, lastReviewedAt: new Date().toISOString() } : e,
  );
}

export function removeStudyError(errors: StudyError[], id: string): StudyError[] {
  return errors.filter((e) => e.id !== id);
}

export const countPendingErrors = (errors: StudyError[]): number =>
  errors.filter((e) => e.status !== 'mastered').length;
