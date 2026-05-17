import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Stethoscope, CalendarDays } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { applySeo } from '@/lib/seo';
import PathwayCard from '@/components/PathwayCard';
import { Button } from '@/components/ui/button';
import logoImage from '@/assets/logo-medestudia.png';

const Index: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    applySeo({
      title: "MedEstudia",
      description: "Plataforma educativa basada en inteligencia artificial para estudiantes de ciencias médicas.",
      url: "https://medestudia-v2.vercel.app",
      image: "https://medestudia-v2.vercel.app/og-medestudia.png",
    });
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      
      <main className="flex-1 container py-12 md:py-20">
        {/* Hero Section */}
        <div className="text-center mb-12 md:mb-16 animate-fade-in">
          <div className="flex justify-center mb-6">
            <img 
              src={logoImage} 
              alt="MedEstudia" 
              className="h-16 md:h-20 w-auto"
            />
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground mb-4 text-balance">
            {t('heroTitle')}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
            {t('heroSubtitle')}
          </p>
        </div>

        {/* Convención Científica — faculty event */}
        <div className="max-w-2xl mx-auto mb-12 md:mb-14">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border border-primary/25 bg-gradient-to-br from-primary/10 via-card to-card p-4 md:p-5 shadow-sm">
            <div className="flex flex-1 items-start gap-3 min-w-0">
              <div className="rounded-lg bg-primary/15 p-2.5 text-primary shrink-0">
                <CalendarDays className="h-6 w-6" aria-hidden />
              </div>
              <div className="min-w-0 text-left">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                  {t('convention2026Badge')}
                </p>
                <h2 className="mt-1 font-serif text-lg font-semibold text-foreground md:text-xl">
                  {t('conventionHomeTitle')}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('conventionHomeDesc')}
                </p>
              </div>
            </div>
            <Button
              type="button"
              className="w-full shrink-0 sm:w-auto"
              onClick={() => navigate('/convencion')}
            >
              {t('conventionHomeButton')}
            </Button>
          </div>
        </div>

        {/* Path Selection */}
        <div className="mb-8 text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            {t('selectPath')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
          <PathwayCard
            title={t('preclinical')}
            description={t('preclinicalDesc')}
            icon={<BookOpen className="h-10 w-10" />}
            variant="preclinical"
            onClick={() => navigate('/preclinico')}
          />
          
          <PathwayCard
            title={t('clinical')}
            description={t('clinicalDesc')}
            icon={<Stethoscope className="h-10 w-10" />}
            variant="clinical"
            onClick={() => navigate('/clinico')}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
