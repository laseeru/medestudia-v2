import { describe, expect, it } from 'vitest';
import { translations } from './translations';

/** Controls added by the study-loop hardening work must exist in both locales. */
const REQUIRED_KEYS = [
  // Quick session lifecycle and gating
  'quickSession', 'startSession', 'resumeSession', 'discardSession',
  'sessionUnfinished', 'sessionLockedExplain', 'sessionLockedQuestions',
  'sessionDiscardConfirm', 'sessionDiscardYes', 'cancel',
  'sessionReplacePrompt', 'sessionReplaceYes',
  'sessionStep', 'sessionOf', 'sessionNext', 'sessionFinish',
  // Summary
  'sessionComplete', 'sessionAnswered', 'sessionCorrect', 'sessionAccuracy',
  'sessionMistakes', 'sessionTopicStudied', 'sessionReviewMistakes',
  'sessionNothingAnswered', 'sessionIncomplete',
  // Error notebook
  'errorNotebook', 'retryQuestion', 'markMastered', 'removeEntry',
  'errorsPendingOne', 'errorsPendingMany',
  // Daily challenge content-review
  'challengeDraftNotice', 'challengeFacultyReviewed', 'hypotheticalCase',
];

describe('translations', () => {
  it.each(REQUIRED_KEYS)('%s exists in Spanish and English', (key) => {
    const entry = translations[key];
    expect(entry, `missing key: ${key}`).toBeDefined();
    expect(entry.es.trim().length).toBeGreaterThan(0);
    expect(entry.en.trim().length).toBeGreaterThan(0);
  });

  it('has no key where a locale is blank', () => {
    const blank = Object.entries(translations)
      .filter(([, v]) => !v.es?.trim() || !v.en?.trim())
      .map(([k]) => k);
    expect(blank).toEqual([]);
  });

  it('the session step control is not labelled like the quiz\'s own next button', () => {
    // Both render at once during a questions step, so identical labels would
    // put two indistinguishable buttons on screen.
    for (const locale of ['es', 'en'] as const) {
      expect(translations.sessionNext[locale]).not.toBe(translations.nextQuestion[locale]);
      expect(translations.sessionNext[locale]).not.toBe(translations.finishQuiz[locale]);
    }
  });

  it('the session finish control is distinct from the quiz\'s finish button', () => {
    for (const locale of ['es', 'en'] as const) {
      expect(translations.sessionFinish[locale]).not.toBe(translations.nextQuestion[locale]);
    }
  });

  it('does not leave Spanish text sitting in the English column', () => {
    // Catches copy-paste when adding a key; a handful of terms are identical
    // across both languages and are legitimately shared.
    const shared = new Set(['Cardiovascular', 'Gastrointestinal', 'IgG']);
    const suspicious = Object.entries(translations)
      .filter(([, v]) => v.es === v.en && v.es.length > 12 && !shared.has(v.es))
      .map(([k]) => k);
    expect(suspicious).toEqual([]);
  });
});
