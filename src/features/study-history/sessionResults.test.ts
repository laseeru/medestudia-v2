import { describe, expect, it } from 'vitest';
import { summariseSession } from './studyEvents';
import type { StudyEvent } from './types';

const ev = (over: Partial<StudyEvent>): StudyEvent => ({
  version: 1,
  at: 1_000,
  pathway: 'preclinical',
  subject: 'Anatomía',
  correct: true,
  sourceTool: 'quiz',
  ...over,
});

const session = { sessionId: 'S1', startedAt: 500 };

describe('summariseSession', () => {
  it('counts only events tagged with this session id', () => {
    const events = [
      ev({ sessionId: 'S1', correct: true }),
      ev({ sessionId: 'S1', correct: false }),
      ev({ sessionId: 'S2', correct: true }),
    ];
    const r = summariseSession(events, session);
    expect(r.answered).toBe(2);
    expect(r.correct).toBe(1);
    expect(r.mistakes).toBe(1);
    expect(r.accuracy).toBe(50);
  });

  it('excludes an ordinary MCQ answered outside any session', () => {
    const events = [ev({ sessionId: 'S1' }), ev({ sourceTool: 'mcq' })];
    expect(summariseSession(events, session).answered).toBe(1);
  });

  it('excludes the daily challenge', () => {
    const events = [ev({ sessionId: 'S1' }), ev({ sourceTool: 'daily-challenge' })];
    expect(summariseSession(events, session).answered).toBe(1);
  });

  it('excludes a concurrent session in another tab, even at the same moment', () => {
    const events = [ev({ sessionId: 'S1', at: 9_000 }), ev({ sessionId: 'S2', at: 9_000 })];
    expect(summariseSession(events, session).answered).toBe(1);
  });

  it('ignores timestamps entirely when matching by id', () => {
    // An event recorded before startedAt but tagged with this session still counts.
    expect(summariseSession([ev({ sessionId: 'S1', at: 1 })], session).answered).toBe(1);
  });

  it('reports null accuracy rather than 0% when nothing was answered', () => {
    const r = summariseSession([ev({ sessionId: 'other' })], session);
    expect(r.answered).toBe(0);
    expect(r.accuracy).toBeNull();
  });

  it('falls back to the time window for a migrated v1 session', () => {
    const legacy = { sessionId: 'S1', startedAt: 500, legacyTimeWindow: true };
    // Untagged events after startedAt are the only signal v1 sessions have.
    const events = [ev({ at: 600 }), ev({ at: 700, correct: false }), ev({ at: 100 })];
    const r = summariseSession(events, legacy);
    expect(r.answered).toBe(2);
    expect(r.correct).toBe(1);
  });
});
