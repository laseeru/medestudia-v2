import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface StudyTrailProps {
  /** Ordered path, outermost first. The last entry is the current position. */
  steps: string[];
  onBack: () => void;
}

/**
 * Back control plus the path that led here, for the multi-step study flows.
 *
 * These screens previously showed a bare "← Volver" text link on the left and
 * the current selection as a right-aligned span, so the two halves of the same
 * idea sat at opposite ends of the row and only the final step was ever
 * visible. Showing the whole trail makes depth legible: a student can see they
 * are two levels into Clínico rather than inferring it.
 */
const StudyTrail: React.FC<StudyTrailProps> = ({ steps, onBack }) => {
  const { t } = useLanguage();

  return (
    <div className="mb-5 flex items-center gap-3 border-b border-border pb-3">
      <button
        type="button"
        onClick={onBack}
        className="-ml-2 inline-flex h-9 shrink-0 items-center gap-1 rounded-md px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        {t('back')}
      </button>

      <nav aria-label={t('studyPath')} className="min-w-0 flex-1">
        <ol className="flex items-center gap-1.5 overflow-hidden text-sm">
          {steps.map((step, i) => {
            const isCurrent = i === steps.length - 1;

            // Ancestor steps collapse on narrow screens to keep the row on one
            // line. The separator lives inside the step it follows, so hiding a
            // step never leaves a stray "/" in front of the current one.
            if (!isCurrent) {
              return (
                <li
                  key={`${step}-${i}`}
                  className="hidden min-w-0 items-center gap-1.5 sm:flex"
                >
                  <span className="truncate text-muted-foreground">{step}</span>
                  <span aria-hidden="true" className="text-muted-foreground/50">
                    /
                  </span>
                </li>
              );
            }

            return (
              <li key={`${step}-${i}`} className="min-w-0">
                <span aria-current="step" className="block truncate font-medium text-foreground">
                  {step}
                </span>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
};

export default StudyTrail;
