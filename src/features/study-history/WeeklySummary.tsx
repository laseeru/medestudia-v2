import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWeeklyActivity } from './useStudyHistory';

const PendingErrorsLink: React.FC<{ count: number }> = ({ count }) => {
  const { t } = useLanguage();
  return (
    <p className="mt-2 text-sm">
      <Link to="/errores" className="font-medium text-foreground underline-offset-4 hover:underline">
        {count} {count === 1 ? t('errorsPendingOne') : t('errorsPendingMany')}
      </Link>
    </p>
  );
};

/**
 * Seven-day summary computed from locally recorded answers.
 *
 * Only counts activity recorded since this feature shipped — no attempt is made
 * to reconstruct history from the older per-quiz score store, which would
 * double-count quiz questions and miss standalone MCQs.
 */
const WeeklySummary: React.FC = () => {
  const { t } = useLanguage();
  const { questions, accuracy, topics, pendingErrors, hasActivity } = useWeeklyActivity();

  // A week with no answers shows an invitation, never a row of zeros — even
  // when there are errors waiting, which still get their own link below.
  if (!hasActivity) {
    return (
      <section aria-labelledby="semana">
        <h2 id="semana" className="type-eyebrow">
          {t('thisWeek')}
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {t('weekEmpty')} {t('weekEmptyAction')}
        </p>
        {pendingErrors > 0 && <PendingErrorsLink count={pendingErrors} />}
      </section>
    );
  }

  // Spanish needs the singular form for a count of one.
  const stats: Array<{ value: string; label: string }> = [
    { value: String(questions), label: questions === 1 ? t('weekQuestionOne') : t('weekQuestions') },
    ...(accuracy !== null ? [{ value: `${accuracy}%`, label: t('weekAccuracy') }] : []),
    { value: String(topics), label: topics === 1 ? t('weekTopicOne') : t('weekTopics') },
  ];

  return (
    <section aria-labelledby="semana">
      <h2 id="semana" className="type-eyebrow">
        {t('thisWeek')}
      </h2>
      <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
        {stats.map((s) => (
          <div key={s.label} className="flex items-baseline gap-1.5">
            <dt className="sr-only">{s.label}</dt>
            <dd className="text-lg font-semibold text-foreground">{s.value}</dd>
            <span aria-hidden="true" className="text-sm text-muted-foreground">
              {s.label}
            </span>
          </div>
        ))}
      </dl>

      {pendingErrors > 0 && <PendingErrorsLink count={pendingErrors} />}
    </section>
  );
};

export default WeeklySummary;
