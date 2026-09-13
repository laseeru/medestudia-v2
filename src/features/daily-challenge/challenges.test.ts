import { describe, expect, it } from 'vitest';
import { DAILY_CHALLENGES, selectChallengeForDay } from './challenges';

describe('challenge bank integrity', () => {
  it('has unique ids', () => {
    const ids = DAILY_CHALLENGES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('offers four options in both languages with a valid correct index', () => {
    for (const c of DAILY_CHALLENGES) {
      expect(c.options.es).toHaveLength(4);
      expect(c.options.en).toHaveLength(4);
      expect(c.correctIndex).toBeGreaterThanOrEqual(0);
      expect(c.correctIndex).toBeLessThan(4);
    }
  });

  it('provides both languages for every prompt and explanation', () => {
    for (const c of DAILY_CHALLENGES) {
      expect(c.prompt.es.length).toBeGreaterThan(0);
      expect(c.prompt.en.length).toBeGreaterThan(0);
      expect(c.explanation.es.length).toBeGreaterThan(0);
      expect(c.explanation.en.length).toBeGreaterThan(0);
    }
  });
});

describe('content review metadata', () => {
  it('every challenge declares a review status', () => {
    for (const c of DAILY_CHALLENGES) {
      expect(c.reviewStatus, `${c.id} is missing reviewStatus`).toBeDefined();
      expect(['draft', 'faculty-reviewed']).toContain(c.reviewStatus);
    }
  });

  it('only a faculty-reviewed challenge may name a reviewer', () => {
    for (const c of DAILY_CHALLENGES) {
      if (c.reviewStatus === 'draft') {
        expect(c.reviewedBy, `${c.id} is a draft but names a reviewer`).toBeUndefined();
      }
    }
  });

  it('no source note claims an official guideline', () => {
    // Locally authored cases must never read as endorsed by a real body.
    const forbidden = /(gu[ií]a oficial|official guideline|MINSAP|OMS\b|WHO\b|seg[uú]n la norma)/i;
    for (const c of DAILY_CHALLENGES) {
      for (const note of [c.sourceNote?.es, c.sourceNote?.en]) {
        if (note) expect(note, `${c.id} source note overclaims`).not.toMatch(forbidden);
      }
    }
  });

  it('states severe-range hypertension as systolic OR diastolic', () => {
    const preeclampsia = DAILY_CHALLENGES.find((c) => c.id === 'clin-preeclampsia');
    expect(preeclampsia).toBeDefined();
    expect(preeclampsia!.explanation.es).toContain('≥160');
    expect(preeclampsia!.explanation.es).toContain('≥110');
    expect(preeclampsia!.explanation.es).toMatch(/\bO\b|o la diast/);
    expect(preeclampsia!.explanation.en).toMatch(/OR/);
  });
});

describe('selectChallengeForDay', () => {
  it('is deterministic for a given day', () => {
    expect(selectChallengeForDay('2026-06-15').id).toBe(selectChallengeForDay('2026-06-15').id);
  });

  it('gives different days different challenges over a short run', () => {
    const week = ['2026-06-15', '2026-06-16', '2026-06-17', '2026-06-18', '2026-06-19'];
    const ids = new Set(week.map((d) => selectChallengeForDay(d).id));
    expect(ids.size).toBeGreaterThan(1);
  });

  it('covers most of the bank across a year', () => {
    const ids = new Set<string>();
    for (let day = 0; day < 365; day += 1) {
      const date = new Date(2026, 0, 1 + day);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      ids.add(selectChallengeForDay(key).id);
    }
    expect(ids.size).toBe(DAILY_CHALLENGES.length);
  });

  it('always returns a real challenge', () => {
    expect(DAILY_CHALLENGES).toContain(selectChallengeForDay('2026-01-01'));
  });
});
