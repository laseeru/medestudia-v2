import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHeader from '@/components/PageHeader';
import EducationalNote from '@/components/EducationalNote';
import { Button } from '@/components/ui/button';
import TopicExplainer from '@/components/TopicExplainer';
import QuickQuiz from '@/components/QuickQuiz';
import { loadStudyEvents, summariseSession } from '@/features/study-history/studyEvents';
import type { Pathway } from '@/features/study-history/types';
import { allRequiredStepsComplete, createSession, isStepComplete, markStepComplete } from './sessionBuilder';
import { clearSession, isAreaValidForPathway, loadSession, saveSession } from './storage';
import type { QuickSession, SessionDuration, SessionGoal } from './types';

/**
 * Runs a quick session by handing each step to a tool that already exists —
 * TopicExplainer for concepts, QuickQuiz for questions.
 *
 * Progress is gated on lifecycle callbacks from those tools, never on reading
 * their rendered output, so "Sesión completada" can only appear after the
 * required activity genuinely finished.
 */
const QuickSessionView: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [session, setSession] = useState<QuickSession | null>(null);
  const [initialised, setInitialised] = useState(false);

  useEffect(() => {
    const resumed = loadSession();
    const areaParam = searchParams.get('area');
    const pathwayParam: Pathway = searchParams.get('pathway') === 'clinical' ? 'clinical' : 'preclinical';

    // Params only start a session when the pathway/area pair is actually valid,
    // so a hand-edited URL cannot create e.g. a clinical Anatomy session.
    if (areaParam && isAreaValidForPathway(pathwayParam, areaParam)) {
      const durationParam = Number(searchParams.get('duration'));
      const duration: SessionDuration = durationParam === 5 || durationParam === 20 ? durationParam : 10;
      const goalParam = searchParams.get('goal');
      const goal: SessionGoal = goalParam === 'review' || goalParam === 'practice' ? goalParam : 'mixed';

      const matchesResumed =
        resumed &&
        resumed.areaKey === areaParam &&
        resumed.goal === goal &&
        resumed.duration === duration &&
        resumed.pathway === pathwayParam;

      const next = matchesResumed
        ? resumed
        : createSession({ duration, goal, pathway: pathwayParam, areaKey: areaParam });
      setSession(next);
      saveSession(next);
      setInitialised(true);
      return;
    }

    // No usable params: restore whatever was left unfinished.
    if (resumed) setSession(resumed);
    setInitialised(true);
  }, [searchParams]);

  const persist = useCallback((next: QuickSession) => {
    setSession(next);
    saveSession(next);
  }, []);

  /** Called by a child tool when its activity genuinely finished. */
  const completeCurrentStep = useCallback(() => {
    setSession((current) => {
      if (!current) return current;
      const next = markStepComplete(current, current.currentStep);
      if (next !== current) saveSession(next);
      return next;
    });
  }, []);

  const advance = () => {
    if (!session) return;
    persist({ ...session, currentStep: Math.min(session.currentStep + 1, session.steps.length - 1) });
  };

  /** Finishing clears storage, so the homepage stops offering a resume. */
  const finish = () => {
    clearSession();
    navigate('/');
  };

  // Only this session's answers count: events are matched on sessionId.
  const results = useMemo(
    () => (session ? summariseSession(loadStudyEvents(), session) : null),
    [session],
  );

  if (!initialised) return null;

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="container flex-1 py-6 sm:py-8">
          <PageHeader title={t('quickSession')} description={t('quickSessionDesc')} />
          <Button onClick={() => navigate('/')}>{t('back')}</Button>
        </main>
        <Footer />
      </div>
    );
  }

  const step = session.steps[session.currentStep];
  const areaLabel = t(session.areaKey);
  const mode = session.pathway === 'clinical' ? 'clinical-study' : 'preclinical';
  const variant = session.pathway === 'clinical' ? 'clinical' : 'preclinical';
  const canAdvance = isStepComplete(session, session.currentStep);

  const lockReason =
    step.kind === 'explain'
      ? t('sessionLockedExplain')
      : step.kind === 'questions'
        ? t('sessionLockedQuestions')
        : '';

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="container flex-1 py-6 sm:py-8">
        <div className="mx-auto max-w-3xl">
          <PageHeader
            eyebrow={`${t('quickSession')} · ${session.duration} ${t('minutesShort')}`}
            title={areaLabel}
            note={<EducationalNote />}
          />

          <div className="mb-5">
            <p className="text-xs text-muted-foreground">
              {t('sessionStep')} {session.currentStep + 1} {t('sessionOf')} {session.steps.length}
            </p>
            <div
              role="progressbar"
              aria-valuenow={session.currentStep + 1}
              aria-valuemin={1}
              aria-valuemax={session.steps.length}
              aria-label={t('quickSession')}
              className="mt-1.5 flex gap-1"
            >
              {session.steps.map((_, i) => (
                <span
                  key={i}
                  className={`h-1 flex-1 rounded-full ${
                    i <= session.currentStep ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>

          {step.kind === 'explain' && (
            <TopicExplainer
              subject={areaLabel}
              mode={mode}
              variant={variant}
              onExplanationLoaded={completeCurrentStep}
            />
          )}

          {step.kind === 'questions' && (
            <QuickQuiz
              subject={areaLabel}
              mode={mode}
              variant={variant}
              questionCount={step.count}
              sessionId={session.sessionId}
              onQuizCompleted={completeCurrentStep}
            />
          )}

          {step.kind === 'summary' && results && (
            <section aria-labelledby="resumen-sesion">
              {/* Only call it complete when the gated steps actually finished —
                  a hand-edited currentStep must not manufacture a success. */}
              <h2 id="resumen-sesion" className="type-section-title">
                {allRequiredStepsComplete(session) ? t('sessionComplete') : t('sessionIncomplete')}
              </h2>

              {results.answered === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">{t('sessionNothingAnswered')}</p>
              ) : (
                <dl className="mt-3 space-y-1.5 text-sm">
                  <div className="flex justify-between border-b border-border py-1.5">
                    <dt className="text-muted-foreground">{t('sessionTopicStudied')}</dt>
                    <dd className="font-medium text-foreground">{areaLabel}</dd>
                  </div>
                  <div className="flex justify-between border-b border-border py-1.5">
                    <dt className="text-muted-foreground">{t('sessionAnswered')}</dt>
                    <dd className="font-medium text-foreground">{results.answered}</dd>
                  </div>
                  <div className="flex justify-between border-b border-border py-1.5">
                    <dt className="text-muted-foreground">{t('sessionCorrect')}</dt>
                    <dd className="font-medium text-foreground">{results.correct}</dd>
                  </div>
                  {results.accuracy !== null && (
                    <div className="flex justify-between border-b border-border py-1.5">
                      <dt className="text-muted-foreground">{t('sessionAccuracy')}</dt>
                      <dd className="font-medium text-foreground">{results.accuracy}%</dd>
                    </div>
                  )}
                  {results.mistakes > 0 && (
                    <div className="flex justify-between border-b border-border py-1.5">
                      <dt className="text-muted-foreground">{t('sessionMistakes')}</dt>
                      <dd className="font-medium text-foreground">{results.mistakes}</dd>
                    </div>
                  )}
                </dl>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {results.mistakes > 0 && (
                  <Button
                    variant="outline"
                    className="h-10"
                    onClick={() => navigate(`/errores?session=${encodeURIComponent(session.sessionId)}`)}
                  >
                    {t('sessionReviewMistakes')}
                  </Button>
                )}
                <Button onClick={finish} className="h-10">
                  {t('sessionFinish')}
                </Button>
              </div>
            </section>
          )}

          {step.kind !== 'summary' && (
            <div className="mt-6 border-t border-border pt-4">
              {/* Says why Next is unavailable rather than leaving a dead button. */}
              {!canAdvance && <p className="mb-2 text-sm text-muted-foreground">{lockReason}</p>}
              <div className="flex flex-wrap gap-2">
                <Button onClick={advance} disabled={!canAdvance} className="h-10">
                  {t('sessionNext')}
                </Button>
                {/* Discarding stays available even while Next is locked. */}
                <Button variant="ghost" className="h-10" onClick={finish}>
                  {t('discardSession')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default QuickSessionView;
