import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  Send,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHeader from '@/components/PageHeader';
import StudyTrail from '@/components/StudyTrail';
import EducationalNote from '@/components/EducationalNote';
import SubjectTile from '@/components/SubjectTile';
import StudyToolSelector, { StudyTool } from '@/components/StudyToolSelector';
import MCQGenerator from '@/components/MCQGenerator';
import QuickQuiz from '@/components/QuickQuiz';
import TopicExplainer from '@/components/TopicExplainer';
import ScoreStats from '@/components/ScoreStats';
import ChatInterface from '@/components/ChatInterface';
import { useRecordRecentStudy } from '@/features/study-history/useStudyHistory';
import { buildStudyRoute } from '@/features/study-history/recentStudy';

const PENDING_CHAT_QUESTION_KEY = 'medestudia_pending_preclinical_chat_question';

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

const SUBJECT_KEYS = new Set(preclinicalSubjects.map((s) => s.key));
const TOOL_KEYS = new Set<StudyTool>(['mcq', 'quiz', 'explain', 'stats']);

const Preclinical: React.FC = () => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const recordRecentStudy = useRecordRecentStudy();

  // "Continue where you left off" returns here with the selection in the URL,
  // so a bookmark or a shared link restores the same place and the browser
  // back button still behaves normally.
  const [selectedSubject, setSelectedSubject] = useState<string | null>(() => {
    const subject = searchParams.get('subject');
    return subject && SUBJECT_KEYS.has(subject) ? subject : null;
  });
  const [selectedTool, setSelectedTool] = useState<StudyTool | null>(() => {
    const subject = searchParams.get('subject');
    const tool = searchParams.get('tool') as StudyTool | null;
    // A tool without a subject would render a study screen with nothing to study.
    if (!subject || !SUBJECT_KEYS.has(subject)) return null;
    return tool && TOOL_KEYS.has(tool) ? tool : null;
  });
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

  /** Selecting a tool is the first moment the learner is actually studying. */
  const handleSelectTool = (tool: StudyTool) => {
    setSelectedTool(tool);
    if (!selectedSubject) return;
    recordRecentStudy({
      pathway: 'preclinical',
      subject: selectedSubject,
      tool,
      displayLabel: `${t('preclinical')} · ${t(selectedSubject)}`,
      route: buildStudyRoute({ pathway: 'preclinical', subject: selectedSubject, tool }),
    });
  };

  const handleAssistantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuestion = assistantQuestion.trim();
    setAssistantSubmitting(true);

    if (trimmedQuestion) {
      // Persist pending question to survive view transitions and state timing.
      try {
        sessionStorage.setItem(PENDING_CHAT_QUESTION_KEY, trimmedQuestion);
      } catch {
        // Ignore sessionStorage errors
      }
      setInitialAssistantQuestion(trimmedQuestion);
      setAssistantQuestion('');
    }
    setActiveLearningTool('assistant');
    recordRecentStudy({
      pathway: 'preclinical',
      tool: 'chat',
      displayLabel: `${t('preclinical')} · ${t('medicalAssistant')}`,
      route: '/preclinico',
    });
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

  const isSelecting = !selectedSubject && !activeLearningTool;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="container flex-1 py-6 sm:py-8">
        {isSelecting && (
          <PageHeader
            title={t('preclinical')}
            description={t('preclinicalDesc')}
            note={<EducationalNote />}
          />
        )}

        {isSelecting ? (
          <div className="space-y-8 animate-fade-in">
            {/* Ask-anything entry point. One surface: this was a bordered
                section wrapping a second bordered card wrapping the form. */}
            <section aria-labelledby="asistente">
              <h2 id="asistente" className="type-section-title">
                {t('medicalAssistant')}
              </h2>
              <p className="measure mt-1 text-sm text-muted-foreground">
                {t('medicalAssistantDesc')}
              </p>

              <form onSubmit={handleAssistantSubmit} className="mt-3">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    value={assistantQuestion}
                    onChange={(e) => setAssistantQuestion(e.target.value)}
                    placeholder={t('medicalAssistantInputPlaceholder')}
                    aria-label={t('medicalAssistant')}
                    className="h-11 w-full flex-1 rounded-md border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground/70"
                  />
                  <button
                    type="submit"
                    disabled={assistantSubmitting}
                    className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                  >
                    <Send className="h-4 w-4" aria-hidden="true" />
                    {assistantSubmitting ? t('loading') : t('askAssistant')}
                  </button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {t('medicalAssistantExample')}
                </p>
              </form>
            </section>

            <section aria-labelledby="asignaturas">
              <h2 id="asignaturas" className="type-section-title">
                {t('subjectsSection')}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{t('subjectsSectionDesc')}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                {preclinicalSubjects.map((subject) => (
                  <SubjectTile
                    key={subject.key}
                    title={t(subject.key)}
                    icon={<subject.icon className="h-4 w-4" />}
                    onClick={() => setSelectedSubject(subject.key)}
                    variant="preclinical"
                  />
                ))}
              </div>
            </section>
          </div>
        ) : activeLearningTool ? (
          <div className="animate-fade-in">
            <StudyTrail steps={[t('preclinical'), t('medicalAssistant')]} onBack={handleBack} />
            <ChatInterface
              mode="preclinical"
              initialQuestion={initialAssistantQuestion || (() => {
                let sessionQuestion = '';
                try {
                  sessionQuestion = sessionStorage.getItem(PENDING_CHAT_QUESTION_KEY) || '';
                } catch {
                  sessionQuestion = '';
                }
                return sessionQuestion;
              })()}
              onInitialQuestionUsed={() => {
                setInitialAssistantQuestion('');
                try {
                  sessionStorage.removeItem(PENDING_CHAT_QUESTION_KEY);
                } catch {
                  // Ignore sessionStorage errors
                }
              }}
              fullscreen
            />
          </div>
        ) : !selectedTool ? (
          <div className="mx-auto max-w-3xl animate-fade-in">
            <StudyTrail steps={[t('preclinical'), t(selectedSubject!)]} onBack={handleBack} />
            <h2 className="type-eyebrow mb-3">{t('selectStudyTool')}</h2>
            <StudyToolSelector
              selectedTool={selectedTool}
              onSelectTool={handleSelectTool}
              variant="preclinical"
            />
          </div>
        ) : (
          <div className="mx-auto max-w-3xl animate-fade-in">
            <StudyTrail
              steps={[t('preclinical'), t(selectedSubject!)]}
              onBack={handleBack}
            />
            {renderStudyTool()}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Preclinical;
