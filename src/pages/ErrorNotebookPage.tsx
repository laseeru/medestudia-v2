import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHeader from '@/components/PageHeader';
import ErrorNotebook from '@/features/study-history/ErrorNotebook';

const ErrorNotebookPage: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="container flex-1 py-6 sm:py-8">
        <div className="mx-auto max-w-3xl">
          <PageHeader title={t('errorNotebook')} description={t('errorNotebookDesc')} />
          <ErrorNotebook />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ErrorNotebookPage;
