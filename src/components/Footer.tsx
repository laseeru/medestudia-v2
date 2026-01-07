import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="mt-auto border-t border-border bg-muted/50">
      <div className="container py-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-lg bg-accent/20 px-4 py-2">
            <span className="text-xs font-medium uppercase tracking-wider text-accent-foreground">
              Prototipo
            </span>
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">
            {t('prototypeNotice')}
          </p>
          <p className="text-xs text-muted-foreground/60">
            MedEstudia © 2024
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
