import React, { useState } from 'react';
import { 
  Bone, 
  Microscope, 
  Dna, 
  FlaskConical, 
  Activity, 
  Bug, 
  Worm, 
  Shield, 
  BarChart3, 
  Pill 
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SubjectTile from '@/components/SubjectTile';
import StudyToolSelector, { StudyTool } from '@/components/StudyToolSelector';
import MCQGenerator from '@/components/MCQGenerator';
import QuickQuiz from '@/components/QuickQuiz';
import TopicExplainer from '@/components/TopicExplainer';
import ScoreStats from '@/components/ScoreStats';

const preclinicalSubjects = [
  { key: 'anatomy', icon: Bone },
  { key: 'histology', icon: Microscope },
  { key: 'cellBiology', icon: Dna },
  { key: 'biochemistry', icon: FlaskConical },
  { key: 'physiology', icon: Activity },
  { key: 'microbiology', icon: Bug },
  { key: 'parasitology', icon: Worm },
  { key: 'immunology', icon: Shield },
  { key: 'biostatistics', icon: BarChart3 },
  { key: 'pharmacology', icon: Pill },
];

const Preclinical: React.FC = () => {
  const { t } = useLanguage();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<StudyTool | null>(null);

  const handleBack = () => {
    if (selectedTool) {
      setSelectedTool(null);
    } else {
      setSelectedSubject(null);
    }
  };

  const renderStudyTool = () => {
    const subject = t(selectedSubject!);
    
    switch (selectedTool) {
      case 'mcq':
        return <MCQGenerator subject={subject} variant="preclinical" />;
      case 'quiz':
        return <QuickQuiz subject={subject} mode="preclinical" variant="preclinical" />;
      case 'explain':
        return <TopicExplainer subject={subject} mode="preclinical" variant="preclinical" />;
      case 'stats':
        return <ScoreStats variant="preclinical" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      
      <main className="flex-1 container py-8 md:py-12">
        {/* Title */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-2">
            {t('preclinical')}
          </h1>
          <p className="text-muted-foreground">
            {t('preclinicalDesc')}
          </p>
        </div>

        {/* Educational Badge */}
        <div className="max-w-3xl mx-auto mb-8 flex justify-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted border border-border text-xs text-muted-foreground">
            {t('educationalUse')}
          </span>
        </div>

        {!selectedSubject ? (
          /* Subject Grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-w-5xl mx-auto animate-fade-in">
            {preclinicalSubjects.map((subject) => (
              <SubjectTile
                key={subject.key}
                title={t(subject.key)}
                icon={<subject.icon className="h-6 w-6" />}
                onClick={() => setSelectedSubject(subject.key)}
                variant="preclinical"
              />
            ))}
          </div>
        ) : !selectedTool ? (
          /* Study Tool Selection */
          <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <button
                onClick={handleBack}
                className="text-sm text-academic hover:underline flex items-center gap-1"
              >
                ← {t('back')}
              </button>
              <span className="text-sm font-medium text-foreground">
                {t(selectedSubject)}
              </span>
            </div>
            
            <h2 className="text-lg font-medium text-center text-muted-foreground">
              {t('selectStudyTool')}
            </h2>
            
            <StudyToolSelector
              selectedTool={selectedTool}
              onSelectTool={setSelectedTool}
              variant="preclinical"
            />
          </div>
        ) : (
          /* Active Study Tool */
          <div className="max-w-3xl mx-auto space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <button
                onClick={handleBack}
                className="text-sm text-academic hover:underline flex items-center gap-1"
              >
                ← {t('back')}
              </button>
              <span className="text-sm font-medium text-foreground">
                {t(selectedSubject)}
              </span>
            </div>
            
            {renderStudyTool()}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Preclinical;
