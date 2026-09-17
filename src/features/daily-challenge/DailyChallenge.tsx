import React, { useMemo, useState } from 'react';
import { Check, Stethoscope } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { localDayKey } from '@/features/study-history/storage';
import { useRecordAnswer } from '@/features/study-history/useStudyHistory';
import { selectChallengeForDay } from './challenges';
import { isTodayComplete, saveDailyChallengeResult } from './storage';

/**
 * One short case per local calendar day, chosen deterministically from a local
 * bank — no network request when the homepage loads.
 */
const DailyChallenge: React.FC = () => {
  const { t, language } = useLanguage();
  const recordAnswer = useRecordAnswer();

  const dayKey = localDayKey();
  const challenge = useMemo(() => selectChallengeForDay(dayKey), [dayKey]);

  const [alreadyDone] = useState(() => isTodayComplete(challenge.id, dayKey));
  const [picked, setPicked] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  const options = challenge.options[language];
  const isAnswered = picked !== null;
  const isCorrect = picked === challenge.correctIndex;
  // Once today's challenge is recorded, answering again would double-count the
  // event and the notebook entry. Reopening it is read-only.
  const locked = alreadyDone || isAnswered;

  const handlePick = (index: number) => {
    if (locked) return;
    setPicked(index);
    const correct = index === challenge.correctIndex;
    saveDailyChallengeResult(challenge.id, correct);

    // A missed challenge joins the notebook like any other wrong answer.
    recordAnswer({
      correct,
      pathway: challenge.pathway,
      subject: t(challenge.areaKey),
      sourceTool: 'daily-challenge',
      question: challenge.prompt[language],
      options,
      selectedAnswer: options[index],
      correctAnswer: options[challenge.correctIndex],
      explanation: challenge.explanation[language],
    });
  };

  return (
    <section aria-labelledby="guardia-hoy">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h2 id="guardia-hoy" className="type-section-title">
          {t('dailyChallenge')}
        </h2>
        {(alreadyDone || isAnswered) && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
            {t('dailyChallengeDone')}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{t('dailyChallengeDesc')}</p>

      {!open && !isAnswered ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 inline-flex h-10 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/60"
        >
          <Stethoscope className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          {t(challenge.areaKey)} · {t('dailyChallengeStart')}
        </button>
      ) : (
        <div className="measure mt-3">
          <p className="type-eyebrow">{t(challenge.areaKey)}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-foreground">
            {challenge.prompt[language]}
          </p>

          <ul className="mt-3 space-y-1.5">
            {options.map((option, index) => {
              const correctOption = index === challenge.correctIndex;
              const pickedOption = index === picked;
              return (
                <li key={option}>
                  <button
                    type="button"
                    onClick={() => handlePick(index)}
                    disabled={locked}
                    className={cn(
                      'w-full rounded-md border px-3 py-2 text-left text-sm transition-colors',
                      !locked && 'border-border bg-card hover:bg-muted/60',
                      locked && correctOption && 'border-success/60 bg-success/10',
                      locked && pickedOption && !correctOption && 'border-warning/60 bg-warning/10',
                      locked && !pickedOption && !correctOption && 'border-border opacity-60',
                    )}
                  >
                    <span className="flex items-start gap-2">
                      {locked && correctOption && (
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                      )}
                      <span>{option}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {locked && (
            <div className="mt-3" role="status">
              {isAnswered && (
                <p className="text-sm font-medium text-foreground">
                  {isCorrect ? t('dailyChallengeCorrect') : t('dailyChallengeIncorrect')}
                </p>
              )}
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {challenge.explanation[language]}
              </p>
              {isAnswered && !isCorrect && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {t('dailyChallengeSavedToNotebook')}
                </p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                {challenge.sourceNote?.[language] ?? t('hypotheticalCase')}
              </p>
              {/* Never let a locally authored draft read as an official guideline. */}
              <p className="mt-1 text-xs text-muted-foreground">
                {challenge.reviewStatus === 'faculty-reviewed'
                  ? `${t('challengeFacultyReviewed')}${challenge.reviewedBy ? ` · ${challenge.reviewedBy}` : ''}`
                  : t('challengeDraftNotice')}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default DailyChallenge;
