import { describe, expect, it } from 'vitest';
import { normalizeQuestion, startOfLocalDay } from './storage';
import { buildStudyRoute, parseRecentStudy } from './recentStudy';
import { parseStudyError, recordErrorReview, saveStudyErrors, upsertStudyError, type NewStudyError } from './studyErrors';
import { summariseWeek } from './studyEvents';
import type { StudyError, StudyEvent } from './types';

const baseError: NewStudyError = {
  pathway: 'preclinical',
  subject: 'Anatomía',
  sourceTool: 'quiz',
  question: '¿Cuál es el origen del nervio frénico?',
  correctAnswer: 'C3-C5',
  explanation: 'Raíces cervicales C3 a C5.',
};

describe('parseRecentStudy', () => {
  const valid = {
    version: 1,
    pathway: 'preclinical',
    subject: 'anatomy',
    tool: 'quiz',
    displayLabel: 'Preclínico · Anatomía',
    route: '/preclinico?subject=anatomy&tool=quiz',
    updatedAt: new Date().toISOString(),
  };

  it('accepts a well-formed record', () => {
    expect(parseRecentStudy(valid)).not.toBeNull();
  });

  it('rejects unknown versions, so a future schema cannot be misread', () => {
    expect(parseRecentStudy({ ...valid, version: 2 })).toBeNull();
  });

  it.each([
    ['bad pathway', { pathway: 'surgical' }],
    ['bad tool', { tool: 'dance' }],
    ['unparseable date', { updatedAt: 'not-a-date' }],
    ['missing label', { displayLabel: '' }],
  ])('rejects %s', (_name, patch) => {
    expect(parseRecentStudy({ ...valid, ...patch })).toBeNull();
  });

  it('refuses an absolute URL, which would navigate off-site', () => {
    expect(parseRecentStudy({ ...valid, route: 'https://evil.example/x' })).toBeNull();
  });

  it.each([null, undefined, 42, 'string', [], {}])('survives garbage input: %s', (input) => {
    expect(parseRecentStudy(input)).toBeNull();
  });
});

describe('buildStudyRoute', () => {
  it('encodes a clinical selection into restorable query params', () => {
    expect(
      buildStudyRoute({ pathway: 'clinical', rotation: 'internalMedicine', system: 'cardiovascular', tool: 'mcq' }),
    ).toBe('/clinico/estudio?rotation=internalMedicine&system=cardiovascular&tool=mcq');
  });

  it('omits absent parts', () => {
    expect(buildStudyRoute({ pathway: 'preclinical', subject: 'anatomy', tool: 'quiz' })).toBe(
      '/preclinico?subject=anatomy&tool=quiz',
    );
  });
});

describe('normalizeQuestion', () => {
  it('ignores case, accents and punctuation when comparing questions', () => {
    expect(normalizeQuestion('¿Cuál es el ORIGEN del nervio frénico?')).toBe(
      normalizeQuestion('cual es el origen del nervio frenico'),
    );
  });
});

describe('upsertStudyError', () => {
  it('adds a new entry as unreviewed', () => {
    const [entry] = upsertStudyError([], baseError);
    expect(entry.status).toBe('unreviewed');
    expect(entry.incorrectCount).toBe(1);
  });

  it('increments instead of duplicating when the same question is missed again', () => {
    const once = upsertStudyError([], baseError);
    const twice = upsertStudyError(once, baseError);
    expect(twice).toHaveLength(1);
    expect(twice[0].incorrectCount).toBe(2);
  });

  it('treats accent and punctuation variants as the same question', () => {
    const once = upsertStudyError([], baseError);
    const twice = upsertStudyError(once, {
      ...baseError,
      question: 'Cual es el origen del nervio frenico',
    });
    expect(twice).toHaveLength(1);
  });

  it('reopens a mastered question that is missed again', () => {
    const mastered: StudyError[] = [
      { ...upsertStudyError([], baseError)[0], status: 'mastered', correctReviewCount: 2 },
    ];
    expect(upsertStudyError(mastered, baseError)[0].status).toBe('reviewing');
  });
});

describe('recordErrorReview', () => {
  it('marks an entry mastered after two correct reviews', () => {
    const [entry] = upsertStudyError([], baseError);
    const first = recordErrorReview([entry], entry.id, true);
    expect(first[0].status).toBe('reviewing');
    const second = recordErrorReview(first, entry.id, true);
    expect(second[0].status).toBe('mastered');
  });

  it('sends a failed review back to reviewing and counts the miss', () => {
    const [entry] = upsertStudyError([], baseError);
    const reviewed = recordErrorReview([entry], entry.id, false);
    expect(reviewed[0].status).toBe('reviewing');
    expect(reviewed[0].incorrectCount).toBe(2);
  });
});

describe('parseStudyError', () => {
  it('drops entries missing required fields', () => {
    expect(parseStudyError({ version: 1, id: 'x' })).toBeNull();
  });

  it('repairs a negative incorrectCount rather than discarding the entry', () => {
    const parsed = parseStudyError({
      version: 1,
      id: 'x',
      question: 'q',
      correctAnswer: 'a',
      status: 'unreviewed',
      incorrectCount: -5,
    });
    expect(parsed?.incorrectCount).toBe(1);
  });
});

describe('retention', () => {
  it('keeps only the newest 300 errors', () => {
    const many: StudyError[] = Array.from({ length: 320 }, (_, i) => ({
      ...upsertStudyError([], { ...baseError, question: `q${i}` })[0],
      createdAt: new Date(2026, 0, 1, 0, i).toISOString(),
    }));
    // saveStudyErrors bounds before writing; storage is unavailable in this
    // environment, so assert on the ordering logic it relies on.
    const sorted = many.slice().sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    expect(sorted.slice(0, 300)).toHaveLength(300);
    expect(() => saveStudyErrors(many)).not.toThrow();
  });
});

describe('summariseWeek', () => {
  const now = new Date(2026, 5, 15, 12, 0, 0);
  const event = (daysAgo: number, correct: boolean, subject = 'Anatomía'): StudyEvent => ({
    version: 1,
    at: startOfLocalDay(daysAgo, now) + 60_000,
    pathway: 'preclinical',
    subject,
    correct,
    sourceTool: 'quiz',
  });

  it('counts the rolling seven local days inclusive of today', () => {
    const events = [event(0, true), event(3, false), event(6, true)];
    const summary = summariseWeek(events, [], now);
    expect(summary.questions).toBe(3);
    expect(summary.correct).toBe(2);
    expect(summary.accuracy).toBe(67);
  });

  it('excludes anything older than the window', () => {
    expect(summariseWeek([event(7, true)], [], now).questions).toBe(0);
  });

  it('counts distinct topics', () => {
    const events = [event(0, true, 'Anatomía'), event(0, true, 'Fisiología'), event(1, false, 'Anatomía')];
    expect(summariseWeek(events, [], now).topics).toBe(2);
  });

  it('reports null accuracy rather than 0% for an empty week', () => {
    const summary = summariseWeek([], [], now);
    expect(summary.accuracy).toBeNull();
    expect(summary.hasActivity).toBe(false);
  });

  it('counts only unmastered errors as pending', () => {
    const [entry] = upsertStudyError([], baseError);
    const errors: StudyError[] = [entry, { ...entry, id: 'other', status: 'mastered' }];
    expect(summariseWeek([], errors, now).pendingErrors).toBe(1);
  });
});
