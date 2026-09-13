import type { QuickSession, SessionDuration, SessionGoal, SessionStep } from './types';
import type { Pathway } from '@/features/study-history/types';

/**
 * Composition table.
 *
 * Question counts are chosen so a session needs at most ONE quiz generation
 * request: the quiz tool already returns several questions per call, so a
 * 5-question step costs the same as a 2-question one in network terms.
 * Durations are expectations, not timers — nothing counts down.
 */
const QUESTION_COUNT: Record<SessionDuration, number> = {
  5: 2,
  10: 4,
  20: 5,
};

export function buildSessionSteps(duration: SessionDuration, goal: SessionGoal): SessionStep[] {
  const questions: SessionStep = { kind: 'questions', count: QUESTION_COUNT[duration] };

  if (goal === 'practice') {
    return [questions, { kind: 'summary' }];
  }
  if (goal === 'review') {
    // Concept-first, with a couple of questions to check it landed.
    return [{ kind: 'explain' }, { kind: 'questions', count: Math.min(2, QUESTION_COUNT[duration]) }, { kind: 'summary' }];
  }
  return [{ kind: 'explain' }, questions, { kind: 'summary' }];
}

export function newSessionId(): string {
  return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createSession(params: {
  duration: SessionDuration;
  goal: SessionGoal;
  pathway: Pathway;
  areaKey: string;
}): QuickSession {
  return {
    version: 2,
    sessionId: newSessionId(),
    startedAt: Date.now(),
    duration: params.duration,
    goal: params.goal,
    pathway: params.pathway,
    areaKey: params.areaKey,
    steps: buildSessionSteps(params.duration, params.goal),
    currentStep: 0,
    completedSteps: [],
  };
}

/**
 * Steps that require the learner to actually do something before moving on.
 * A summary is terminal, so it never gates anything.
 */
export function stepRequiresCompletion(step: QuickSession['steps'][number]): boolean {
  return step.kind === 'explain' || step.kind === 'questions';
}

export function isStepComplete(session: QuickSession, index: number): boolean {
  const step = session.steps[index];
  if (!step || !stepRequiresCompletion(step)) return true;
  return session.completedSteps.includes(index);
}

export function markStepComplete(session: QuickSession, index: number): QuickSession {
  if (session.completedSteps.includes(index)) return session;
  return { ...session, completedSteps: [...session.completedSteps, index].sort((a, b) => a - b) };
}

/** True once every gated step has been finished. */
export function allRequiredStepsComplete(session: QuickSession): boolean {
  return session.steps.every((step, i) => !stepRequiresCompletion(step) || session.completedSteps.includes(i));
}

export const isSessionComplete = (session: QuickSession): boolean =>
  session.currentStep >= session.steps.length - 1;
