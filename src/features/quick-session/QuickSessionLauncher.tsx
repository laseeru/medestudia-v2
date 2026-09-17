import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Timer } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Pathway } from '@/features/study-history/types';
import type { SessionDuration, SessionGoal } from './types';
import { CLINICAL_AREA_KEYS, PRECLINICAL_AREA_KEYS } from './areas';
import { clearSession, loadSession } from './storage';
import type { QuickSession } from './types';

const DURATIONS: SessionDuration[] = [5, 10, 20];
const GOALS: SessionGoal[] = ['mixed', 'review', 'practice'];

/**
 * Compact launcher for the homepage. Collapsed by default so the homepage does
 * not open with a form; expanding reveals the three choices and nothing else.
 */
const QuickSessionLauncher: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  // An unfinished session is otherwise invisible from the homepage.
  const [unfinished, setUnfinished] = useState<QuickSession | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [confirmReplace, setConfirmReplace] = useState(false);

  useEffect(() => {
    setUnfinished(loadSession());
  }, []);
  const [duration, setDuration] = useState<SessionDuration>(10);
  const [pathway, setPathway] = useState<Pathway>('preclinical');
  const [goal, setGoal] = useState<SessionGoal>('mixed');
  const [areaKey, setAreaKey] = useState<string>(PRECLINICAL_AREA_KEYS[0]);

  const areas = pathway === 'preclinical' ? PRECLINICAL_AREA_KEYS : CLINICAL_AREA_KEYS;

  const handlePathway = (next: Pathway) => {
    setPathway(next);
    setAreaKey(next === 'preclinical' ? PRECLINICAL_AREA_KEYS[0] : CLINICAL_AREA_KEYS[0]);
  };

  const startNow = () => {
    const query = new URLSearchParams({
      duration: String(duration),
      goal,
      pathway,
      area: areaKey,
    });
    navigate(`/sesion?${query.toString()}`);
  };

  /** Starting a new session while one is unfinished asks before replacing it. */
  const start = () => {
    if (unfinished) {
      setConfirmReplace(true);
      return;
    }
    startNow();
  };

  const discardUnfinished = () => {
    clearSession();
    setUnfinished(null);
    setConfirmDiscard(false);
  };

  const goalLabelKey = (g: QuickSession['goal']) =>
    g === 'mixed' ? 'goalMixed' : g === 'review' ? 'goalReview' : 'goalPractice';

  // Resume banner: shown whenever storage holds an unfinished session.
  const resumeBanner = unfinished ? (
    <div className="rounded-lg border border-primary/40 bg-primary/5 p-4">
      <h3 className="type-eyebrow text-primary">{t('sessionUnfinished')}</h3>
      <p className="mt-1 text-sm font-medium text-foreground">
        {t(unfinished.areaKey)} · {unfinished.duration} {t('minutesShort')}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {t('sessionStep')} {unfinished.currentStep + 1} {t('sessionOf')} {unfinished.steps.length}
        {' · '}
        {t(goalLabelKey(unfinished.goal))}
      </p>

      {confirmDiscard ? (
        <div className="mt-3">
          <p className="text-sm text-foreground">{t('sessionDiscardConfirm')}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={discardUnfinished}>
              {t('sessionDiscardYes')}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmDiscard(false)}>
              {t('cancel')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {/* No query params: /sesion restores the stored session as-is. */}
          <Button className="h-10" onClick={() => navigate('/sesion')}>
            {t('resumeSession')}
          </Button>
          <button
            type="button"
            onClick={() => setConfirmDiscard(true)}
            className="h-10 rounded-md px-2 text-xs text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
          >
            {t('discardSession')}
          </button>
        </div>
      )}
    </div>
  ) : null;

  if (!open) {
    return (
      <section aria-labelledby="sesion-rapida" className="space-y-3">
        <h2 id="sesion-rapida" className="sr-only">
          {t('quickSession')}
        </h2>
        {resumeBanner}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/60"
        >
          <Timer className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          {t('quickSession')}
        </button>
      </section>
    );
  }

  return (
    <section aria-labelledby="sesion-rapida" className="space-y-3">
      {resumeBanner}
      <div className="rounded-lg border border-border bg-card p-4">
      {/* h2 keeps the outline correct: this sits between the page h1 and the
          pathway section's h2, so an h3 here would skip a level. */}
      <h2 id="sesion-rapida" className="type-section-title">{t('quickSession')}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t('quickSessionDesc')}</p>

      <fieldset className="mt-3">
        <legend className="type-eyebrow mb-1.5">{t('sessionDuration')}</legend>
        <div className="flex gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={duration === d}
              onClick={() => setDuration(d)}
              className={cn(
                'h-10 min-w-[4.5rem] rounded-md border px-3 text-sm font-medium transition-colors',
                duration === d
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border text-muted-foreground hover:bg-muted/60',
              )}
            >
              {d} {t('minutesShort')}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-3">
        <legend className="type-eyebrow mb-1.5">{t('selectPath')}</legend>
        <div className="flex gap-2">
          {(['preclinical', 'clinical'] as Pathway[]).map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={pathway === p}
              onClick={() => handlePathway(p)}
              className={cn(
                'h-10 rounded-md border px-3 text-sm font-medium transition-colors',
                pathway === p
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border text-muted-foreground hover:bg-muted/60',
              )}
            >
              {t(p === 'preclinical' ? 'preclinical' : 'clinical')}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-3 flex flex-wrap gap-3">
        <div className="min-w-[10rem] flex-1">
          <label htmlFor="session-area" className="type-eyebrow mb-1.5 block">
            {t('sessionPickTopic')}
          </label>
          <select
            id="session-area"
            value={areaKey}
            onChange={(e) => setAreaKey(e.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground"
          >
            {areas.map((key) => (
              <option key={key} value={key}>
                {t(key)}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[10rem] flex-1">
          <label htmlFor="session-goal" className="type-eyebrow mb-1.5 block">
            {t('sessionGoal')}
          </label>
          <select
            id="session-goal"
            value={goal}
            onChange={(e) => setGoal(e.target.value as SessionGoal)}
            className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground"
          >
            {GOALS.map((g) => (
              <option key={g} value={g}>
                {t(g === 'mixed' ? 'goalMixed' : g === 'review' ? 'goalReview' : 'goalPractice')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {confirmReplace ? (
        <div className="mt-4">
          <p className="text-sm text-foreground">{t('sessionReplacePrompt')}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={startNow}>
              {t('sessionReplaceYes')}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setConfirmReplace(false)}>
              {t('cancel')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex gap-2">
          <Button type="button" onClick={start} className="h-10">
            {t('startSession')}
          </Button>
          <Button type="button" variant="ghost" className="h-10" onClick={() => setOpen(false)}>
            {t('continueDismiss')}
          </Button>
        </div>
      )}
      </div>
    </section>
  );
};

export default QuickSessionLauncher;
