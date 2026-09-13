import { STORAGE_KEYS, isRecord, readJson, removeKey, writeJson } from '@/features/study-history/storage';
import { MAX_QUESTIONS_PER_STEP, type QuickSession, type SessionDuration, type SessionGoal, type SessionStep } from './types';
import { CLINICAL_AREA_KEYS, PRECLINICAL_AREA_KEYS } from './areas';
import { newSessionId } from './sessionBuilder';

const DURATIONS: SessionDuration[] = [5, 10, 20];
const GOALS: SessionGoal[] = ['review', 'practice', 'mixed'];

const PRECLINICAL = new Set<string>(PRECLINICAL_AREA_KEYS);
const CLINICAL = new Set<string>(CLINICAL_AREA_KEYS);

/** An area key is only valid for the pathway that actually offers it. */
export function isAreaValidForPathway(pathway: string, areaKey: string): boolean {
  if (pathway === 'preclinical') return PRECLINICAL.has(areaKey);
  if (pathway === 'clinical') return CLINICAL.has(areaKey);
  return false;
}

function parseStep(value: unknown): SessionStep | null {
  if (!isRecord(value)) return null;
  if (value.kind === 'explain') return { kind: 'explain' };
  if (value.kind === 'summary') return { kind: 'summary' };
  if (value.kind === 'questions') {
    const { count } = value;
    if (typeof count !== 'number') return null;
    if (!Number.isInteger(count)) return null;
    if (count <= 0 || count > MAX_QUESTIONS_PER_STEP) return null;
    return { kind: 'questions', count };
  }
  return null;
}

/**
 * Steps must form a well-shaped sequence: at least one activity, exactly one
 * summary, and that summary last. Anything else is corrupt storage, not a
 * session the view can render safely.
 */
function parseSteps(value: unknown): SessionStep[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;

  const steps: SessionStep[] = [];
  for (const raw of value) {
    const step = parseStep(raw);
    if (!step) return null;
    steps.push(step);
  }

  const summaryCount = steps.filter((s) => s.kind === 'summary').length;
  if (summaryCount !== 1) return null;
  if (steps[steps.length - 1].kind !== 'summary') return null;
  if (steps.length < 2) return null;

  return steps;
}

function parseCompletedSteps(value: unknown, stepCount: number): number[] {
  if (!Array.isArray(value)) return [];
  const out = new Set<number>();
  for (const item of value) {
    if (typeof item === 'number' && Number.isInteger(item) && item >= 0 && item < stepCount) {
      out.add(item);
    }
  }
  return [...out].sort((a, b) => a - b);
}

export function parseSession(value: unknown): QuickSession | null {
  if (!isRecord(value)) return null;

  // v1 had no sessionId and no completedSteps; migrate rather than discard so a
  // learner mid-session across an update keeps their place.
  const isV1 = value.version === 1;
  if (value.version !== 2 && !isV1) return null;

  if (!DURATIONS.includes(value.duration as SessionDuration)) return null;
  if (!GOALS.includes(value.goal as SessionGoal)) return null;
  if (typeof value.startedAt !== 'number' || !Number.isFinite(value.startedAt)) return null;

  const pathway = value.pathway === 'clinical' ? 'clinical' : 'preclinical';
  if (typeof value.areaKey !== 'string' || !value.areaKey) return null;
  // Blocks a hand-edited URL or stale record producing e.g. clinical + anatomy.
  if (!isAreaValidForPathway(pathway, value.areaKey)) return null;

  const steps = parseSteps(value.steps);
  if (!steps) return null;

  const currentStep =
    typeof value.currentStep === 'number' && Number.isInteger(value.currentStep) && value.currentStep >= 0
      ? Math.min(value.currentStep, steps.length - 1)
      : 0;

  const sessionId =
    typeof value.sessionId === 'string' && value.sessionId ? value.sessionId : newSessionId();

  return {
    version: 2,
    sessionId,
    startedAt: value.startedAt,
    duration: value.duration as SessionDuration,
    goal: value.goal as SessionGoal,
    pathway,
    areaKey: value.areaKey,
    steps,
    currentStep,
    completedSteps: parseCompletedSteps(value.completedSteps, steps.length),
    // Events from a v1 session were never tagged, so its summary must fall
    // back to the time window rather than reporting a false zero.
    ...(isV1 ? { legacyTimeWindow: true } : {}),
  };
}

export const loadSession = () => readJson(STORAGE_KEYS.quickSession, parseSession);
export const saveSession = (session: QuickSession) => writeJson(STORAGE_KEYS.quickSession, session);
export const clearSession = () => removeKey(STORAGE_KEYS.quickSession);
