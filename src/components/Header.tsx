import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Globe, ChevronLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import logoImage from '@/assets/logo-medestudia.png';

const Header: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';

  const toggleLanguage = () => {
    setLanguage(language === 'es' ? 'en' : 'es');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          {!isHome && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {t('back')}
            </Button>
          )}
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <div className="p-1.5 bg-card/50 rounded-xl border border-border/50">
              <img 
                src={logoImage} 
                alt="MedEstudia" 
                className="h-7 w-auto rounded-lg"
              />
            </div>
          </button>
        </div>

        <div className="flex items-center gap-4">
          <AIStatusIndicator />
          <Button
            variant="outline"
            size="sm"
            onClick={toggleLanguage}
            className="flex items-center gap-2 font-medium"
          >
            <Globe className="h-4 w-4" />
            <span className="uppercase">{language}</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

const AIStatusIndicator: React.FC = () => {
  const { t } = useLanguage();
  // Simulated status - would connect to real AI service
  const status: 'online' | 'limited' | 'offline' = 'online';
  
  const statusConfig = {
    online: { color: 'bg-green-500', label: t('online') },
    limited: { color: 'bg-yellow-500', label: t('limited') },
    offline: { color: 'bg-red-500', label: t('offline') },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="hidden sm:inline">IA:</span>
      <span className={`h-2 w-2 rounded-full ${config.color} animate-pulse-soft`} />
      <span className="text-xs font-medium">{config.label}</span>
    </div>
  );
};

export default Header;
