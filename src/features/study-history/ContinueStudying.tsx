import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRecentStudy } from './useStudyHistory';
import type { StudyToolId } from './types';

const TOOL_LABEL_KEY: Record<StudyToolId, string> = {
  mcq: 'generateMCQ',
  quiz: 'quickQuiz',
  explain: 'explainTopic',
  chat: 'medicalAssistant',
  stats: 'viewStats',
};

/** Resume the last real study activity. Renders nothing when there is none. */
const ContinueStudying: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { recent, clear } = useRecentStudy();

  if (!recent) return null;

  // Rebuild the label from stored keys so it follows the current language;
  // the persisted displayLabel is only a fallback for older records.
  const parts = [
    t(recent.pathway === 'preclinical' ? 'preclinical' : 'clinical'),
    recent.subject ? t(recent.subject) : null,
    recent.rotation ? t(recent.rotation) : null,
    recent.system ? t(recent.system) : null,
  ].filter(Boolean);
  const label = parts.length > 1 ? parts.join(' · ') : recent.displayLabel;

  return (
    <section aria-labelledby="continuar" className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="continuar" className="type-eyebrow">
            {t('continueStudying')}
          </h2>
          <p className="mt-1 text-sm font-medium text-foreground">{label}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t('lastTool')}: {t(TOOL_LABEL_KEY[recent.tool])}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => navigate(recent.route)}
            className="inline-flex h-10 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t('continueAction')}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
          {/* Deliberately quiet: clearing history should be available, not inviting. */}
          <button
            type="button"
            onClick={clear}
            className="h-10 rounded-md px-2 text-xs text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
          >
            {t('continueDismiss')}
          </button>
        </div>
      </div>
    </section>
  );
};

export default ContinueStudying;
