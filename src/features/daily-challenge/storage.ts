import { STORAGE_KEYS, isRecord, localDayKey, readJson, writeJson } from '@/features/study-history/storage';

interface DailyChallengeRecord {
  version: 1;
  /** Local YYYY-MM-DD of the last completed challenge. */
  dayKey: string;
  challengeId: string;
  correct: boolean;
}

function parse(value: unknown): DailyChallengeRecord | null {
  if (!isRecord(value)) return null;
  if (value.version !== 1) return null;
  if (typeof value.dayKey !== 'string' || typeof value.challengeId !== 'string') return null;
  return {
    version: 1,
    dayKey: value.dayKey,
    challengeId: value.challengeId,
    correct: value.correct === true,
  };
}

export function loadDailyChallengeResult(): DailyChallengeRecord | null {
  return readJson(STORAGE_KEYS.dailyChallenge, parse);
}

/** True when today's challenge has already been answered on this device. */
export function isTodayComplete(challengeId: string, today = localDayKey()): boolean {
  const record = loadDailyChallengeResult();
  return record?.dayKey === today && record.challengeId === challengeId;
}

export function saveDailyChallengeResult(challengeId: string, correct: boolean): void {
  writeJson(STORAGE_KEYS.dailyChallenge, {
    version: 1,
    dayKey: localDayKey(),
    challengeId,
    correct,
  } satisfies DailyChallengeRecord);
}
