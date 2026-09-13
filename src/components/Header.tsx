import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Globe, ChevronLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAIStatus } from '@/contexts/AIStatusContext';
import logoMark from '@/assets/logo-mark.png';
import { cn } from '@/lib/utils';

const Header: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';

  const toggleLanguage = () => {
    setLanguage(language === 'es' ? 'en' : 'es');
  };

  return (
    // Solid surface rather than a translucent blur: the blurred bar tinted
    // whatever scrolled beneath it, which read as decoration and cost a
    // compositing pass on low-end phones.
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card">
      <div className="container flex h-14 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1">
          {!isHome && (
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label={t('back')}
              className="-ml-2 inline-flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate('/')}
            aria-label="MedEstudia"
            className="flex h-10 items-center gap-2 rounded-md px-1 transition-opacity hover:opacity-80"
          >
            <img src={logoMark} alt="" aria-hidden="true" className="h-6 w-auto" />
            <span className="font-serif text-[0.9375rem] font-bold tracking-tight text-foreground">
              MedEstudia
            </span>
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <AIStatusIndicator />
          <button
            type="button"
            onClick={toggleLanguage}
            aria-label={language === 'es' ? 'Switch to English' : 'Cambiar a español'}
            className="inline-flex h-10 items-center gap-1.5 rounded-md border border-border px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Globe className="h-4 w-4" aria-hidden="true" />
            <span className="uppercase">{language}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

const AIStatusIndicator: React.FC = () => {
  const { t } = useLanguage();
  const { status } = useAIStatus();

  // Token-backed rather than raw palette values, and static: a dot that pulses
  // forever is movement that never means anything. The text label carries the
  // state, so the colour is reinforcement rather than the only signal.
  const statusConfig = {
    online: { color: 'bg-success', label: t('online') },
    limited: { color: 'bg-warning', label: t('limited') },
    offline: { color: 'bg-destructive', label: t('offline') },
  } as const;

  const config = statusConfig[status];

  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span aria-hidden="true" className={cn('h-1.5 w-1.5 rounded-full', config.color)} />
      <span className="hidden sm:inline">IA:</span>
      <span className="font-medium">{config.label}</span>
    </span>
  );
};

export default Header;
