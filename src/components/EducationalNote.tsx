import React from 'react';
import { Info } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface EducationalNoteProps {
  /** `full` carries the clinical decision-making caveat; `short` just labels scope. */
  variant?: 'short' | 'full';
}

/**
 * Standing reminder that generated content is for study, not patient care.
 *
 * Previously a centred pill floating between the title and the content, which
 * gave a permanent caveat the visual weight of a call to action. It reads as a
 * quiet footnote to the page title instead — still present on every study
 * screen, no longer competing with them.
 */
const EducationalNote: React.FC<EducationalNoteProps> = ({ variant = 'short' }) => {
  const { t } = useLanguage();

  return (
    <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{variant === 'full' ? t('educationalModeBanner') : t('educationalUse')}</span>
    </p>
  );
};

export default EducationalNote;
