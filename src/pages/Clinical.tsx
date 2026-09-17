import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, FileText } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHeader from '@/components/PageHeader';
import PathwayCard from '@/components/PathwayCard';

const Clinical: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="container flex-1 py-6 sm:py-8">
        <PageHeader title={t('clinical')} description={t('clinicalDesc')} />

        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
          <PathwayCard
            title={t('clinicalStudy')}
            description={t('clinicalStudyDesc')}
            cta={t('pathwayStart')}
            icon={<GraduationCap className="h-5 w-5" />}
            variant="clinical"
            onClick={() => navigate('/clinico/estudio')}
          />
          <PathwayCard
            title={t('clinicalGuidelines')}
            description={t('clinicalGuidelinesDesc')}
            cta={t('pathwayStart')}
            icon={<FileText className="h-5 w-5" />}
            variant="clinical"
            onClick={() => navigate('/clinico/guias')}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Clinical;
