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
  Pill,
  Stethoscope,
  Send,
  Sparkles
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
import ChatInterface from '@/components/ChatInterface';

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
  const [activeLearningTool, setActiveLearningTool] = useState<'assistant' | null>(null);
  const [assistantQuestion, setAssistantQuestion] = useState('');
  const [initialAssistantQuestion, setInitialAssistantQuestion] = useState('');
  const [assistantSubmitting, setAssistantSubmitting] = useState(false);

  const handleBack = () => {
    if (activeLearningTool) {
      setActiveLearningTool(null);
    } else if (selectedTool) {
      setSelectedTool(null);
    } else {
      setSelectedSubject(null);
    }
  };

  const handleAssistantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuestion = assistantQuestion.trim();
    setAssistantSubmitting(true);
    setActiveLearningTool('assistant');
    if (trimmedQuestion) {
      setInitialAssistantQuestion(trimmedQuestion);
      setAssistantQuestion('');
    }
    setTimeout(() => setAssistantSubmitting(false), 200);
  };

  const renderStudyTool = () => {
    const subject = t(selectedSubject!);
    
    switch (selectedTool) {
      case 'mcq':
        return <MCQGenerator subject={subject} variant="preclinical" />;
      case 'quiz':
        return <QuickQuiz subject={subject} mode="preclinical" variant="preclinical" questionCount={10} />;
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

        {!selectedSubject && !activeLearningTool ? (
          /* Study tools + Subject Grid */
          <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
            <section className="p-4 md:p-5 rounded-xl border border-academic/30 bg-academic/5">
              <div className="mb-4 text-center md:text-left">
                <h2 className="text-lg font-semibold text-foreground">{t('studyToolsSection')}</h2>
                <p className="text-sm text-muted-foreground">{t('studyToolsSectionDesc')}</p>
              </div>
              <div className="rounded-2xl border border-academic/40 bg-card/70 shadow-[0_0_0_1px_rgba(59,130,246,0.15),0_0_30px_rgba(59,130,246,0.1)] p-4 md:p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-xl bg-academic/15 border border-academic/30 text-academic flex items-center justify-center">
                      <Stethoscope className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base md:text-lg font-semibold text-foreground">{t('medicalAssistant')}</h3>
                      <p className="text-xs md:text-sm text-muted-foreground">{t('medicalAssistantDesc')}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full border border-academic/30 bg-academic/10 text-academic">
                    <Sparkles className="h-3 w-3" />
                    IA
                  </span>
                </div>

                <form onSubmit={handleAssistantSubmit} className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={assistantQuestion}
                      onChange={(e) => setAssistantQuestion(e.target.value)}
                      placeholder={t('medicalAssistantInputPlaceholder')}
                      autoFocus
                      className="flex-1 rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-lg bg-academic text-white px-4 py-2.5 text-sm font-medium hover:bg-academic/90 transition-colors disabled:opacity-70"
                      disabled={assistantSubmitting}
                    >
                      <Send className="h-4 w-4" />
                      {assistantSubmitting ? t('loading') : t('askAssistant')}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">{t('medicalAssistantExample')}</p>
                </form>
              </div>
            </section>

            <section>
              <div className="mb-4 text-center md:text-left">
                <h2 className="text-lg font-semibold text-foreground">{t('subjectsSection')}</h2>
                <p className="text-sm text-muted-foreground">{t('subjectsSectionDesc')}</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
            </section>
          </div>
        ) : activeLearningTool ? (
          /* Global learning tool mode (not tied to a specific subject) */
          <div className="max-w-4xl mx-auto space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <button
                onClick={handleBack}
                className="text-sm text-academic hover:underline flex items-center gap-1"
              >
                ← {t('back')}
              </button>
              <span className="text-sm font-medium text-foreground">
                {t('medicalAssistant')}
              </span>
            </div>
            <div className="rounded-xl border border-border bg-card p-3 md:p-4">
              <p className="mb-3 text-sm text-muted-foreground">{t('medicalAssistantDesc')}</p>
                <ChatInterface
                  mode="preclinical"
                  initialQuestion={initialAssistantQuestion}
                  onInitialQuestionUsed={() => setInitialAssistantQuestion('')}
                />
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
