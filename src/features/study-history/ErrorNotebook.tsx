import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, RotateCcw, Trash2, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useStudyErrors } from './useStudyHistory';
import type { ErrorStatus, StudyError } from './types';

const STATUS_FILTERS: Array<ErrorStatus | 'all'> = ['all', 'unreviewed', 'reviewing', 'mastered'];

/** One saved mistake: explanation, a retry, and the two ways to close it out. */
const ErrorEntry: React.FC<{
  entry: StudyError;
  onReview: (id: string, correct: boolean) => void;
  onMaster: (id: string) => void;
  onRemove: (id: string) => void;
}> = ({ entry, onReview, onMaster, onRemove }) => {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const [retryChoice, setRetryChoice] = useState<string | null>(null);

  const statusLabel: Record<ErrorStatus, string> = {
    unreviewed: t('errorStatusUnreviewed'),
    reviewing: t('errorStatusReviewing'),
    mastered: t('errorStatusMastered'),
  };

  const handleRetry = (option: string) => {
    if (retryChoice !== null) return;
    setRetryChoice(option);
    onReview(entry.id, option === entry.correctAnswer);
  };

  return (
    <li className="border-b border-border py-4 last:border-b-0">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full items-start gap-3 text-left"
      >
        <ChevronDown
          aria-hidden="true"
          className={cn(
            'mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150',
            expanded && 'rotate-180',
          )}
        />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium leading-snug text-foreground">
            {entry.question}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span>{entry.subject}</span>
            <span aria-hidden="true">·</span>
            {/* Status is text, not just a colour, so it survives colour-blind use. */}
            <span className="font-medium">{statusLabel[entry.status]}</span>
            {entry.incorrectCount > 1 && (
              <>
                <span aria-hidden="true">·</span>
                <span>
                  {t('timesMissed')}: {entry.incorrectCount}
                </span>
              </>
            )}
          </span>
        </span>
      </button>

      {expanded && (
        <div className="mt-3 pl-7">
          {entry.options && entry.options.length > 0 && (
            <ul className="space-y-1.5">
              {entry.options.map((option) => {
                const isCorrect = option === entry.correctAnswer;
                const isPicked = option === retryChoice;
                const revealed = retryChoice !== null;
                return (
                  <li key={option}>
                    <button
                      type="button"
                      onClick={() => handleRetry(option)}
                      disabled={revealed}
                      className={cn(
                        'w-full rounded-md border px-3 py-2 text-left text-sm transition-colors',
                        !revealed && 'border-border hover:bg-muted/60',
                        revealed && isCorrect && 'border-success/60 bg-success/10',
                        revealed && isPicked && !isCorrect && 'border-warning/60 bg-warning/10',
                        revealed && !isPicked && !isCorrect && 'border-border opacity-60',
                      )}
                    >
                      <span className="flex items-center gap-2">
                        {revealed && isCorrect && (
                          <Check className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                        )}
                        <span>{option}</span>
                      </span>
                      {revealed && isCorrect && (
                        <span className="sr-only">{t('correctAnswerLabel')}</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {entry.explanation && (
            <p className="mt-3 border-l-2 border-border pl-3 text-sm leading-relaxed text-muted-foreground">
              {entry.explanation}
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {retryChoice !== null && (
              <Button size="sm" variant="outline" onClick={() => setRetryChoice(null)}>
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                {t('retryQuestion')}
              </Button>
            )}
            {entry.status !== 'mastered' && (
              <Button size="sm" variant="outline" onClick={() => onMaster(entry.id)}>
                <Check className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                {t('markMastered')}
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRemove(entry.id)}
              className="text-muted-foreground"
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              {t('removeEntry')}
            </Button>
          </div>
        </div>
      )}
    </li>
  );
};

const ErrorNotebook: React.FC = () => {
  const { t } = useLanguage();
  const { errors, review, setStatus, remove } = useStudyErrors();
  const [searchParams] = useSearchParams();
  // Set when arriving from a session summary: show only that session's misses.
  const sessionScope = searchParams.get('session');
  const [statusFilter, setStatusFilter] = useState<ErrorStatus | 'all'>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');

  const subjects = useMemo(
    () => Array.from(new Set(errors.map((e) => e.subject))).sort(),
    [errors],
  );

  const visible = useMemo(
    () =>
      errors.filter(
        (e) =>
          (!sessionScope || e.sessionId === sessionScope) &&
          (statusFilter === 'all' || e.status === statusFilter) &&
          (subjectFilter === 'all' || e.subject === subjectFilter),
      ),
    [errors, statusFilter, subjectFilter, sessionScope],
  );

  const statusLabels: Record<ErrorStatus | 'all', string> = {
    all: t('filterAll'),
    unreviewed: t('errorStatusUnreviewed'),
    reviewing: t('errorStatusReviewing'),
    mastered: t('errorStatusMastered'),
  };

  if (errors.length === 0) {
    return (
      <div className="measure">
        <p className="text-sm text-foreground">{t('emptyNotebook')}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t('emptyNotebookDesc')}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <div>
          <label htmlFor="status-filter" className="type-eyebrow mb-1 block">
            {t('filterStatus')}
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ErrorStatus | 'all')}
            className="h-10 rounded-md border border-input bg-card px-2 text-sm text-foreground"
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s} value={s}>
                {statusLabels[s]}
              </option>
            ))}
          </select>
        </div>

        {subjects.length > 1 && (
          <div>
            <label htmlFor="subject-filter" className="type-eyebrow mb-1 block">
              {t('filterSubject')}
            </label>
            <select
              id="subject-filter"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="h-10 max-w-[14rem] rounded-md border border-input bg-card px-2 text-sm text-foreground"
            >
              <option value="all">{t('filterAll')}</option>
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <ul className="mt-4">
        {visible.map((entry) => (
          <ErrorEntry
            key={entry.id}
            entry={entry}
            onReview={review}
            onMaster={(id) => setStatus(id, 'mastered')}
            onRemove={remove}
          />
        ))}
      </ul>

      <p className="mt-6 text-xs text-muted-foreground">{t('notebookRetention')}</p>
    </div>
  );
};

export default ErrorNotebook;
