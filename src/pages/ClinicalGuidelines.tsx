import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import GuidelinesGate from '@/components/GuidelinesGate';
import ChatInterface from '@/components/ChatInterface';

const ClinicalGuidelines: React.FC = () => {
  const { t } = useLanguage();
  const [hasAccepted, setHasAccepted] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      
      <main className="flex-1 container py-8 md:py-12">
        {/* Title */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-2">
            {t('clinicalGuidelines')}
          </h1>
          <p className="text-muted-foreground">
            {t('clinicalGuidelinesDesc')}
          </p>
        </div>

        {!hasAccepted ? (
          <GuidelinesGate onConfirm={() => setHasAccepted(true)} />
        ) : (
          <div className="max-w-3xl mx-auto animate-fade-in">
            <ChatInterface mode="clinical-guidelines" />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ClinicalGuidelines;
