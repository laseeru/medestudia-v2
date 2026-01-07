import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, FileText } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PathwayCard from '@/components/PathwayCard';

const Clinical: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      
      <main className="flex-1 container py-8 md:py-12">
        {/* Title */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-2">
            {t('clinical')}
          </h1>
          <p className="text-muted-foreground">
            {t('clinicalDesc')}
          </p>
        </div>

        {/* Mode Selection */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
          <PathwayCard
            title={t('clinicalStudy')}
            description={t('clinicalStudyDesc')}
            icon={<GraduationCap className="h-10 w-10" />}
            variant="preclinical"
            onClick={() => navigate('/clinico/estudio')}
          />
          
          <PathwayCard
            title={t('clinicalGuidelines')}
            description={t('clinicalGuidelinesDesc')}
            icon={<FileText className="h-10 w-10" />}
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
