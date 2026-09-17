import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Stethoscope, CalendarDays, Award } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { applySeo } from '@/lib/seo';
import PathwayCard from '@/components/PathwayCard';
import { Button } from '@/components/ui/button';
import { CONVENTION_ACTIVE } from '@/lib/convencionConfig';
import ContinueStudying from '@/features/study-history/ContinueStudying';
import WeeklySummary from '@/features/study-history/WeeklySummary';
import QuickSessionLauncher from '@/features/quick-session/QuickSessionLauncher';
import DailyChallenge from '@/features/daily-challenge/DailyChallenge';

const Index: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    applySeo({
      title: 'MedEstudia',
      description:
        'Preguntas de examen, explicaciones y guías clínicas para estudiantes de ciencias médicas.',
      url: 'https://medestudia-v2.vercel.app',
      image: 'https://medestudia-v2.vercel.app/og-medestudia.png',
    });
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Keyboard users can jump the header nav straight to the page content */}
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-3 focus:text-primary-foreground"
      >
        {t('skipToContent')}
      </a>

      <Header />

      <main id="contenido" className="container flex-1 py-8 sm:py-12">
        {/* Identity and purpose. Left-aligned like every other screen: a centred
            hero over a decorative backdrop read as a marketing page rather than
            the front door of a study tool. */}
        <div className="mb-8 sm:mb-10">
          <h1 className="measure font-serif text-2xl font-bold leading-tight text-foreground sm:text-3xl">
            {t('heroTitle')}
          </h1>
          <p className="measure mt-2 text-base leading-relaxed text-muted-foreground">
            {t('heroSubtitle')}
          </p>
        </div>

        {/* Convención Científica — faculty event, only while it is running */}
        {CONVENTION_ACTIVE && (
          <div className="mb-8 flex flex-col gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <div className="min-w-0">
                <p className="type-eyebrow text-primary">{t('convention2026Badge')}</p>
                <h2 className="type-section-title mt-1">{t('conventionHomeTitle')}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{t('conventionHomeDesc')}</p>
              </div>
            </div>
            <Button type="button" className="shrink-0" onClick={() => navigate('/convencion')}>
              {t('conventionHomeButton')}
            </Button>
          </div>
        )}

        {/* Resume first for returning learners; the launcher is the equivalent
            entry point for someone with no history yet. Both render without any
            network request. */}
        <div className="mb-8 space-y-3">
          <ContinueStudying />
          <QuickSessionLauncher />
        </div>

        <section aria-labelledby="rutas">
          <h2 id="rutas" className="type-eyebrow mb-3">
            {t('selectPath')}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            <PathwayCard
              title={t('preclinical')}
              description={t('preclinicalDesc')}
              cta={t('pathwayStart')}
              icon={<BookOpen className="h-5 w-5" />}
              variant="preclinical"
              onClick={() => navigate('/preclinico')}
            />
            <PathwayCard
              title={t('clinical')}
              description={t('clinicalDesc')}
              cta={t('pathwayStart')}
              icon={<Stethoscope className="h-5 w-5" />}
              variant="clinical"
              onClick={() => navigate('/clinico')}
            />
          </div>
        </section>

        <div className="mt-10 space-y-8 border-t border-border pt-6">
          <DailyChallenge />
          <WeeklySummary />
        </div>

        {/* Convención concluida — archive, deliberately quieter than the study
            pathways above it. Certificates stay reachable. */}
        {!CONVENTION_ACTIVE && (
          <section aria-labelledby="convencion-archivo" className="mt-8 border-t border-border pt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <Award className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div className="min-w-0">
                  <h2 id="convencion-archivo" className="text-sm font-semibold text-foreground">
                    {t('conventionEndedTitle')}
                  </h2>
                  <p className="measure mt-1 text-sm text-muted-foreground">
                    {t('conventionEndedDesc')}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2 sm:pl-7">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/convencion/certificado')}
                >
                  {t('conventionEndedCertButton')}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/convencion')}
                >
                  {t('conventionEndedArchiveButton')}
                </Button>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
