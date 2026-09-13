/**
 * Centralised, defensive localStorage access for study history.
 *
 * Every read assumes the stored value may be absent, unparseable, written by an
 * older version of the app, or unreadable because the browser has storage
 * disabled (private mode, quota exhausted). Nothing here throws.
 */

const PREFIX = 'medestudia_';

export const STORAGE_KEYS = {
  recentStudy: `${PREFIX}recent_study_v1`,
  studyErrors: `${PREFIX}study_errors_v1`,
  studyEvents: `${PREFIX}study_events_v1`,
  quickSession: `${PREFIX}quick_session_v1`,
  dailyChallenge: `${PREFIX}daily_challenge_v1`,
} as const;

/** Bounded retention. Oldest entries drop first once the cap is exceeded. */
export const RETENTION = {
  /** Roughly a semester of mistakes; ~200KB worst case. */
  maxErrors: 300,
  /** 90 days of answers at a heavy pace; only the last 7 are ever read. */
  maxEvents: 1000,
} as const;

let storageWarned = false;

/** Returns null when storage is unavailable rather than throwing. */
function getStorage(): Storage | null {
  try {
    const s = window.localStorage;
    // Safari private mode exposes localStorage but throws on write.
    const probe = `${PREFIX}__probe__`;
    s.setItem(probe, '1');
    s.removeItem(probe);
    return s;
  } catch {
    if (!storageWarned) {
      storageWarned = true;
      console.warn('MedEstudia: browser storage unavailable; progress will not persist.');
    }
    return null;
  }
}

export function readJson<T>(key: string, validate: (value: unknown) => T | null): T | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    return validate(JSON.parse(raw));
  } catch {
    // Corrupt or foreign data: drop it so the app recovers on next write.
    try {
      storage.removeItem(key);
    } catch {
      /* nothing further we can do */
    }
    return null;
  }
}

export function writeJson(key: string, value: unknown): boolean {
  const storage = getStorage();
  if (!storage) return false;
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    // Most likely QuotaExceededError. Study history is not worth breaking a
    // study session over, so fail quietly.
    return false;
  }
}

export function removeKey(key: string): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/* ------------------------------------------------------------------ helpers */

export const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

export const isNonEmptyString = (v: unknown): v is string =>
  typeof v === 'string' && v.trim().length > 0;

/** Keeps only entries a validator accepts, so one bad row cannot poison a list. */
export function parseArray<T>(value: unknown, parseItem: (item: unknown) => T | null): T[] {
  if (!Array.isArray(value)) return [];
  const out: T[] = [];
  for (const item of value) {
    const parsed = parseItem(item);
    if (parsed) out.push(parsed);
  }
  return out;
}

/**
 * Question text normalised for duplicate detection: case, accents and
 * punctuation removed. Mirrors the fingerprinting QuickQuiz already uses for
 * "seen question" tracking so the two behave consistently.
 */
export function normalizeQuestion(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Local-midnight day key (YYYY-MM-DD), stable across refreshes and DST. */
export function localDayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Epoch ms for local midnight `daysAgo` days back. */
export function startOfLocalDay(daysAgo = 0, now: Date = new Date()): number {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  d.setDate(d.getDate() - daysAgo);
  return d.getTime();
}
