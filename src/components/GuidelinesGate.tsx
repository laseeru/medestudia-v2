import React, { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

interface GuidelinesGateProps {
  onConfirm: () => void;
}

/**
 * Consent step before the clinical-guidelines assistant.
 *
 * Reworked from a centred 400px-tall panel with a large circular warning badge
 * into a plain, readable statement. A caveat a student must actually read is
 * better served by comfortable measure and left-aligned text than by being
 * centred under an icon.
 */
const GuidelinesGate: React.FC<GuidelinesGateProps> = ({ onConfirm }) => {
  const { t } = useLanguage();
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = () => {
    setIsConfirming(true);
    setTimeout(() => {
      onConfirm();
    }, 300);
  };

  return (
    <div className="measure rounded-lg border border-border bg-card p-5 animate-fade-in">
      <div className="flex items-start gap-3">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden="true" />
        <div className="min-w-0">
          <h2 className="type-section-title">{t('beforeYouStart')}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {t('guidelinesDisclaimer')}
          </p>
        </div>
      </div>
      <Button
        onClick={handleConfirm}
        disabled={isConfirming}
        className="mt-4 h-11 w-full sm:w-auto"
      >
        {t('understand')}
      </Button>
    </div>
  );
};

export default GuidelinesGate;
