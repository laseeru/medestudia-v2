import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ErrorStatus, RecentStudyActivity, StudyError, StudyEvent, WeeklyActivity } from './types';
import { clearRecentStudy, loadRecentStudy, saveRecentStudy } from './recentStudy';
import {
  loadStudyErrors,
  recordErrorReview,
  removeStudyError,
  saveStudyErrors,
  setErrorStatus,
  upsertStudyError,
  type NewStudyError,
} from './studyErrors';
import { appendStudyEvent, loadStudyEvents, saveStudyEvents, summariseWeek } from './studyEvents';

/**
 * Study history lives in localStorage, which React cannot observe. This event
 * lets a write in one component (a quiz recording a mistake) refresh readers in
 * another (the homepage counter) without introducing a state library.
 */
const CHANGE_EVENT = 'medestudia:history-change';

const notifyChange = () => window.dispatchEvent(new Event(CHANGE_EVENT));

function useHistorySubscription(reload: () => void) {
  useEffect(() => {
    reload();
    window.addEventListener(CHANGE_EVENT, reload);
    // `storage` fires when another tab writes, keeping tabs consistent.
    window.addEventListener('storage', reload);
    return () => {
      window.removeEventListener(CHANGE_EVENT, reload);
      window.removeEventListener('storage', reload);
    };
  }, [reload]);
}

/* ------------------------------------------------------------ recent study */

export function useRecentStudy() {
  const [recent, setRecent] = useState<RecentStudyActivity | null>(null);
  const reload = useCallback(() => setRecent(loadRecentStudy()), []);
  useHistorySubscription(reload);

  const clear = useCallback(() => {
    clearRecentStudy();
    setRecent(null);
    notifyChange();
  }, []);

  return { recent, clear, reload };
}

/** Write-only helper for the study screens; avoids re-rendering on save. */
export function useRecordRecentStudy() {
  return useCallback((activity: Parameters<typeof saveRecentStudy>[0]) => {
    saveRecentStudy(activity);
    notifyChange();
  }, []);
}

/* ----------------------------------------------------------- study errors */

export function useStudyErrors() {
  const [errors, setErrors] = useState<StudyError[]>([]);
  const reload = useCallback(() => setErrors(loadStudyErrors()), []);
  useHistorySubscription(reload);

  const commit = useCallback((next: StudyError[]) => {
    saveStudyErrors(next);
    setErrors(next);
    notifyChange();
  }, []);

  return {
    errors,
    pendingCount: useMemo(() => errors.filter((e) => e.status !== 'mastered').length, [errors]),
    review: useCallback(
      (id: string, wasCorrect: boolean) => commit(recordErrorReview(loadStudyErrors(), id, wasCorrect)),
      [commit],
    ),
    setStatus: useCallback(
      (id: string, status: ErrorStatus) => commit(setErrorStatus(loadStudyErrors(), id, status)),
      [commit],
    ),
    remove: useCallback((id: string) => commit(removeStudyError(loadStudyErrors(), id)), [commit]),
    reload,
  };
}

/**
 * Records one answered question: the event always, plus an error-notebook entry
 * when it was wrong. Reads fresh from storage before writing so concurrent
 * components never clobber each other's updates.
 */
export function useRecordAnswer() {
  return useCallback((input: NewStudyError & { correct: boolean; sessionId?: string }) => {
    const event: Omit<StudyEvent, 'version'> = {
      at: Date.now(),
      pathway: input.pathway,
      subject: input.subject,
      correct: input.correct,
      sourceTool: input.sourceTool,
      // Present only inside a quick session, so session summaries can filter.
      ...(input.sessionId ? { sessionId: input.sessionId } : {}),
    };
    saveStudyEvents(appendStudyEvent(loadStudyEvents(), event));

    if (!input.correct) {
      saveStudyErrors(upsertStudyError(loadStudyErrors(), input));
    }
    notifyChange();
  }, []);
}

/* --------------------------------------------------------- weekly summary */

export function useWeeklyActivity(): WeeklyActivity {
  const [summary, setSummary] = useState<WeeklyActivity>(() =>
    summariseWeek([], [], new Date()),
  );
  const reload = useCallback(
    () => setSummary(summariseWeek(loadStudyEvents(), loadStudyErrors())),
    [],
  );
  useHistorySubscription(reload);
  return summary;
}
