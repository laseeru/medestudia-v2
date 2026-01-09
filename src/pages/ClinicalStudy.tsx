import React, { useState } from 'react';
import { 
  Heart, 
  Syringe, 
  Baby, 
  Users, 
  Stethoscope,
  Activity,
  Wind,
  CircleDot,
  Brain,
  Droplets
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

const rotations = [
  { key: 'internalMedicine', icon: Heart },
  { key: 'surgery', icon: Syringe },
  { key: 'pediatrics', icon: Baby },
  { key: 'gynecology', icon: Users },
  { key: 'generalMedicine', icon: Stethoscope },
];

const systems = [
  { key: 'cardiovascular', icon: Activity },
  { key: 'respiratory', icon: Wind },
  { key: 'endocrine', icon: CircleDot },
  { key: 'gastrointestinal', icon: Droplets },
  { key: 'neurological', icon: Brain },
  { key: 'renal', icon: Droplets },
];

const ClinicalStudy: React.FC = () => {
  const { t } = useLanguage();
  const [selectedRotation, setSelectedRotation] = useState<string | null>(null);
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<StudyTool | null>(null);

  const handleBack = () => {
    if (selectedTool) {
      setSelectedTool(null);
    } else if (selectedSystem) {
      setSelectedSystem(null);
    } else {
      setSelectedRotation(null);
    }
  };

  const getSubjectLabel = () => {
    if (selectedSystem) {
      return `${t(selectedRotation!)} - ${t(selectedSystem)}`;
    }
    return t(selectedRotation!);
  };

  const renderStudyTool = () => {
    const subject = getSubjectLabel();
    
    switch (selectedTool) {
      case 'mcq':
        return <MCQGenerator subject={subject} variant="clinical" />;
      case 'quiz':
        return <QuickQuiz subject={subject} mode="clinical-study" variant="clinical" />;
      case 'explain':
        return <TopicExplainer subject={subject} mode="clinical-study" variant="clinical" />;
      case 'stats':
        return <ScoreStats variant="clinical" />;
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
            {t('clinicalStudy')}
          </h1>
          <p className="text-muted-foreground">
            {t('clinicalStudyDesc')}
          </p>
        </div>

        {/* Educational Badge */}
        <div className="max-w-3xl mx-auto mb-8 flex justify-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted border border-border text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-warning" />
            {t('educationalModeBanner')}
          </span>
        </div>

        {!selectedRotation ? (
          /* Rotations Grid */
          <div className="animate-fade-in">
            <h2 className="text-lg font-medium text-center text-muted-foreground mb-6">
              Rotaciones Clínicas
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 max-w-4xl mx-auto">
              {rotations.map((rotation) => (
                <SubjectTile
                  key={rotation.key}
                  title={t(rotation.key)}
                  icon={<rotation.icon className="h-6 w-6" />}
                  onClick={() => setSelectedRotation(rotation.key)}
                  variant="clinical"
                />
              ))}
            </div>
          </div>
        ) : !selectedSystem ? (
          /* Systems Grid */
          <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <button
                onClick={handleBack}
                className="text-sm text-academic hover:underline flex items-center gap-1"
              >
                ← {t('back')}
              </button>
              <span className="text-sm font-medium text-foreground">
                {t(selectedRotation)}
              </span>
            </div>
            <h2 className="text-lg font-medium text-center text-muted-foreground">
              Sistemas / Áreas
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {systems.map((system) => (
                <SubjectTile
                  key={system.key}
                  title={t(system.key)}
                  icon={<system.icon className="h-6 w-6" />}
                  onClick={() => setSelectedSystem(system.key)}
                  variant="clinical"
                />
              ))}
            </div>
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
                {getSubjectLabel()}
              </span>
            </div>
            
            <h2 className="text-lg font-medium text-center text-muted-foreground">
              {t('selectStudyTool')}
            </h2>
            
            <StudyToolSelector
              selectedTool={selectedTool}
              onSelectTool={setSelectedTool}
              variant="clinical"
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
                {getSubjectLabel()}
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

export default ClinicalStudy;
