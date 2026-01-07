import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

interface GuidelinesGateProps {
  onConfirm: () => void;
}

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
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 animate-fade-in">
      <div className="max-w-md text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-medical/10 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-medical" />
          </div>
        </div>
        
        <div className="space-y-3">
          <h2 className="text-xl font-serif font-bold text-foreground">
            {t('clinicalGuidelines')}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('guidelinesDisclaimer')}
          </p>
        </div>

        <Button
          onClick={handleConfirm}
          disabled={isConfirming}
          className="w-full gradient-medical hover:opacity-90 transition-opacity"
        >
          {t('understand')}
        </Button>
      </div>
    </div>
  );
};

export default GuidelinesGate;
