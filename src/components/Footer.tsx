import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="mt-auto border-t border-border bg-muted/30">
      <div className="container py-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-xs text-muted-foreground/70 max-w-2xl leading-relaxed">
            {t('prototypeNotice')}
          </p>
          <p className="text-sm text-muted-foreground">
            MedEstudia © 2025
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
