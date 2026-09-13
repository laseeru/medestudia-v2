import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHeader from '@/components/PageHeader';
import EducationalNote from '@/components/EducationalNote';
import GuidelinesGate from '@/components/GuidelinesGate';
import ChatInterface from '@/components/ChatInterface';

const ClinicalGuidelines: React.FC = () => {
  const { t } = useLanguage();
  const [hasAccepted, setHasAccepted] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="container flex-1 py-6 sm:py-8">
        <PageHeader
          eyebrow={t('clinical')}
          title={t('clinicalGuidelines')}
          description={t('clinicalGuidelinesDesc')}
          note={<EducationalNote variant="full" />}
        />

        {!hasAccepted ? (
          <GuidelinesGate onConfirm={() => setHasAccepted(true)} />
        ) : (
          <div className="animate-fade-in">
            <ChatInterface mode="clinical-guidelines" />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ClinicalGuidelines;
