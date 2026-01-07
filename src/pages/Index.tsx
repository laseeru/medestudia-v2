import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Stethoscope } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PathwayCard from '@/components/PathwayCard';
import logoImage from '@/assets/logo-medestudia.png';

const Index: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

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
