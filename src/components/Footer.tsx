import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="mt-16 border-t border-border">
      <div className="container py-6">
        <div className="measure space-y-2">
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t('prototypeNotice')}
          </p>
          <p className="text-xs text-muted-foreground/70">MedEstudia © 2026</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
