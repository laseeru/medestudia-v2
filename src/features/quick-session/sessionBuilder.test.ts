import { describe, expect, it } from 'vitest';
import {
  allRequiredStepsComplete,
  buildSessionSteps,
  createSession,
  isStepComplete,
  isSessionComplete,
  markStepComplete,
} from './sessionBuilder';
import { isAreaValidForPathway, parseSession } from './storage';
import { MAX_QUESTIONS_PER_STEP } from './types';

const mixed = () => createSession({ duration: 10, goal: 'mixed', pathway: 'preclinical', areaKey: 'anatomy' });

describe('buildSessionSteps', () => {
  it('practice sessions go straight to questions', () => {
    expect(buildSessionSteps(10, 'practice').map((s) => s.kind)).toEqual(['questions', 'summary']);
  });

  it('review and mixed sessions start with a concept step', () => {
    expect(buildSessionSteps(10, 'review')[0].kind).toBe('explain');
    expect(buildSessionSteps(10, 'mixed')[0].kind).toBe('explain');
  });

  it('always ends with exactly one summary', () => {
    for (const duration of [5, 10, 20] as const) {
      for (const goal of ['review', 'practice', 'mixed'] as const) {
        const steps = buildSessionSteps(duration, goal);
        expect(steps.filter((s) => s.kind === 'summary')).toHaveLength(1);
        expect(steps[steps.length - 1].kind).toBe('summary');
      }
    }
  });

  it('uses a single question step, so a session needs one generation request', () => {
    for (const goal of ['review', 'practice', 'mixed'] as const) {
      expect(buildSessionSteps(20, goal).filter((s) => s.kind === 'questions')).toHaveLength(1);
    }
  });
});

describe('advancing requires real completion', () => {
  it('gates explain and questions steps, but never the summary', () => {
    const session = mixed();
    expect(isStepComplete(session, 0)).toBe(false); // explain
    expect(isStepComplete(session, 1)).toBe(false); // questions
    expect(isStepComplete(session, 2)).toBe(true); // summary is terminal
  });

  it('unlocks a step only once it is explicitly marked complete', () => {
    const session = mixed();
    expect(isStepComplete(session, 0)).toBe(false);
    expect(isStepComplete(markStepComplete(session, 0), 0)).toBe(true);
  });

  it('does not consider a session complete while questions are unanswered', () => {
    const session = markStepComplete(mixed(), 0); // explanation loaded only
    expect(allRequiredStepsComplete(session)).toBe(false);
  });

  it('is complete once every gated step is done', () => {
    const session = markStepComplete(markStepComplete(mixed(), 0), 1);
    expect(allRequiredStepsComplete(session)).toBe(true);
  });

  it('marking the same step twice does not duplicate it', () => {
    const once = markStepComplete(mixed(), 0);
    expect(markStepComplete(once, 0).completedSteps).toEqual([0]);
  });

  it('a forged currentStep on the summary is not treated as a finished session', () => {
    // Storage could be hand-edited to point straight at the summary; the
    // heading must not claim completion in that case.
    const forged = parseSession({ ...JSON.parse(JSON.stringify(mixed())), currentStep: 2, completedSteps: [] });
    expect(forged?.currentStep).toBe(2);
    expect(allRequiredStepsComplete(forged!)).toBe(false);
  });

  it('reaching the last index is not the same as having done the work', () => {
    const session = { ...mixed(), currentStep: 2 };
    expect(isSessionComplete(session)).toBe(true);
    expect(allRequiredStepsComplete(session)).toBe(false);
  });
});

describe('parseSession — step validation', () => {
  const valid = () => JSON.parse(JSON.stringify(mixed()));

  it('round-trips a valid session and preserves the step', () => {
    const parsed = parseSession({ ...valid(), currentStep: 1 });
    expect(parsed?.currentStep).toBe(1);
    expect(parsed?.areaKey).toBe('anatomy');
  });

  it('preserves completed steps across a reload', () => {
    const parsed = parseSession({ ...valid(), completedSteps: [0] });
    expect(parsed?.completedSteps).toEqual([0]);
    expect(isStepComplete(parsed!, 0)).toBe(true);
  });

  it.each([
    ['null step', [null, { kind: 'summary' }]],
    ['unknown kind', [{ kind: 'dance' }, { kind: 'summary' }]],
    ['questions without a count', [{ kind: 'questions' }, { kind: 'summary' }]],
    ['negative count', [{ kind: 'questions', count: -3 }, { kind: 'summary' }]],
    ['zero count', [{ kind: 'questions', count: 0 }, { kind: 'summary' }]],
    ['fractional count', [{ kind: 'questions', count: 2.5 }, { kind: 'summary' }]],
    ['excessive count', [{ kind: 'questions', count: MAX_QUESTIONS_PER_STEP + 1 }, { kind: 'summary' }]],
    ['count as string', [{ kind: 'questions', count: '3' }, { kind: 'summary' }]],
    ['no summary at all', [{ kind: 'explain' }]],
    ['summary not last', [{ kind: 'summary' }, { kind: 'explain' }]],
    ['two summaries', [{ kind: 'explain' }, { kind: 'summary' }, { kind: 'summary' }]],
    ['summary only', [{ kind: 'summary' }]],
    ['empty array', []],
    ['not an array', 'steps'],
  ])('rejects %s', (_name, steps) => {
    expect(parseSession({ ...valid(), steps })).toBeNull();
  });
});

describe('parseSession — pathway and area must agree', () => {
  it('accepts matching combinations', () => {
    expect(isAreaValidForPathway('preclinical', 'anatomy')).toBe(true);
    expect(isAreaValidForPathway('clinical', 'pediatrics')).toBe(true);
  });

  it('rejects a clinical Anatomy session', () => {
    expect(isAreaValidForPathway('clinical', 'anatomy')).toBe(false);
    const session = { ...JSON.parse(JSON.stringify(mixed())), pathway: 'clinical', areaKey: 'anatomy' };
    expect(parseSession(session)).toBeNull();
  });

  it('rejects a preclinical Pediatrics session', () => {
    expect(parseSession({ ...JSON.parse(JSON.stringify(mixed())), areaKey: 'pediatrics' })).toBeNull();
  });

  it('rejects an area key that does not exist at all', () => {
    expect(isAreaValidForPathway('preclinical', 'astrology')).toBe(false);
    expect(parseSession({ ...JSON.parse(JSON.stringify(mixed())), areaKey: 'astrology' })).toBeNull();
  });

  it('rejects an unknown pathway', () => {
    expect(isAreaValidForPathway('surgical', 'anatomy')).toBe(false);
  });
});

describe('parseSession — general robustness', () => {
  const valid = () => JSON.parse(JSON.stringify(mixed()));

  it.each([null, undefined, 42, 'x', []])('rejects garbage: %s', (input) => {
    expect(parseSession(input)).toBeNull();
  });

  it('rejects unknown versions', () => {
    expect(parseSession({ ...valid(), version: 9 })).toBeNull();
  });

  it('rejects malformed duration, goal and startedAt', () => {
    expect(parseSession({ ...valid(), duration: 42 })).toBeNull();
    expect(parseSession({ ...valid(), goal: 'cramming' })).toBeNull();
    expect(parseSession({ ...valid(), startedAt: 'yesterday' })).toBeNull();
  });

  it('clamps a step index past the end rather than crashing the view', () => {
    const parsed = parseSession({ ...valid(), currentStep: 99 });
    expect(parsed?.currentStep).toBe(parsed!.steps.length - 1);
  });

  it('drops out-of-range completed-step indices', () => {
    expect(parseSession({ ...valid(), completedSteps: [0, 99, -1, 'x'] })?.completedSteps).toEqual([0]);
  });
});

describe('migration from schema v1', () => {
  const v1 = {
    version: 1,
    startedAt: Date.now(),
    duration: 10,
    goal: 'mixed',
    pathway: 'preclinical',
    areaKey: 'anatomy',
    steps: [{ kind: 'explain' }, { kind: 'questions', count: 4 }, { kind: 'summary' }],
    currentStep: 1,
  };

  it('migrates rather than discarding, so a learner keeps their place', () => {
    const parsed = parseSession(v1);
    expect(parsed).not.toBeNull();
    expect(parsed?.version).toBe(2);
    expect(parsed?.currentStep).toBe(1);
  });

  it('assigns a session id', () => {
    expect(parseSession(v1)?.sessionId).toBeTruthy();
  });

  it('flags the time-window fallback, since v1 events were never tagged', () => {
    expect(parseSession(v1)?.legacyTimeWindow).toBe(true);
  });

  it('does not flag a native v2 session', () => {
    expect(parseSession(JSON.parse(JSON.stringify(mixed())))?.legacyTimeWindow).toBeUndefined();
  });
});
