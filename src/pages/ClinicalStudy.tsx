import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  Droplets,
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
import { useRecordRecentStudy } from '@/features/study-history/useStudyHistory';
import { buildStudyRoute } from '@/features/study-history/recentStudy';

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

const ROTATION_KEYS = new Set(rotations.map((r) => r.key));
const SYSTEM_KEYS = new Set(systems.map((s) => s.key));
const TOOL_KEYS = new Set<StudyTool>(['mcq', 'quiz', 'explain', 'stats']);

const ClinicalStudy: React.FC = () => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const recordRecentStudy = useRecordRecentStudy();

  // Restored from the URL so "continue", bookmarks and back all agree.
  const initialRotation = (() => {
    const rotation = searchParams.get('rotation');
    return rotation && ROTATION_KEYS.has(rotation) ? rotation : null;
  })();
  const initialSystem = (() => {
    const system = searchParams.get('system');
    return initialRotation && system && SYSTEM_KEYS.has(system) ? system : null;
  })();

  const [selectedRotation, setSelectedRotation] = useState<string | null>(initialRotation);
  const [selectedSystem, setSelectedSystem] = useState<string | null>(initialSystem);
  const [selectedTool, setSelectedTool] = useState<StudyTool | null>(() => {
    const tool = searchParams.get('tool') as StudyTool | null;
    // A tool needs a full rotation + system selection behind it to be meaningful.
    if (!initialRotation || !initialSystem) return null;
    return tool && TOOL_KEYS.has(tool) ? tool : null;
  });

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

  /** Breadcrumb steps for the current depth, outermost first. */
  const trailSteps = () => {
    const steps = [t('clinicalStudy')];
    if (selectedRotation) steps.push(t(selectedRotation));
    if (selectedSystem) steps.push(t(selectedSystem));
    return steps;
  };

  /** Selecting a tool is the first moment the learner is actually studying. */
  const handleSelectTool = (tool: StudyTool) => {
    setSelectedTool(tool);
    if (!selectedRotation || !selectedSystem) return;
    recordRecentStudy({
      pathway: 'clinical',
      rotation: selectedRotation,
      system: selectedSystem,
      tool,
      displayLabel: `${t(selectedRotation)} · ${t(selectedSystem)}`,
      route: buildStudyRoute({
        pathway: 'clinical',
        rotation: selectedRotation,
        system: selectedSystem,
        tool,
      }),
    });
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

      <main className="container flex-1 py-6 sm:py-8">
        {!selectedRotation && (
          <PageHeader
            eyebrow={t('clinical')}
            title={t('clinicalStudy')}
            description={t('clinicalStudyDesc')}
            note={<EducationalNote variant="full" />}
          />
        )}

        {!selectedRotation ? (
          <section aria-labelledby="rotaciones" className="animate-fade-in">
            <h2 id="rotaciones" className="type-section-title">
              {t('rotationsSection')}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('rotationsSectionDesc')}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {rotations.map((rotation) => (
                <SubjectTile
                  key={rotation.key}
                  title={t(rotation.key)}
                  icon={<rotation.icon className="h-4 w-4" />}
                  onClick={() => setSelectedRotation(rotation.key)}
                  variant="clinical"
                />
              ))}
            </div>
          </section>
        ) : !selectedSystem ? (
          <div className="animate-fade-in">
            <StudyTrail steps={trailSteps()} onBack={handleBack} />
            <h2 className="type-section-title">{t('systemsSection')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('systemsSectionDesc')}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {systems.map((system) => (
                <SubjectTile
                  key={system.key}
                  title={t(system.key)}
                  icon={<system.icon className="h-4 w-4" />}
                  onClick={() => setSelectedSystem(system.key)}
                  variant="clinical"
                />
              ))}
            </div>
          </div>
        ) : !selectedTool ? (
          <div className="mx-auto max-w-3xl animate-fade-in">
            <StudyTrail steps={trailSteps()} onBack={handleBack} />
            <h2 className="type-eyebrow mb-3">{t('selectStudyTool')}</h2>
            <StudyToolSelector
              selectedTool={selectedTool}
              onSelectTool={handleSelectTool}
              variant="clinical"
            />
          </div>
        ) : (
          <div className="mx-auto max-w-3xl animate-fade-in">
            <StudyTrail steps={trailSteps()} onBack={handleBack} />
            {renderStudyTool()}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ClinicalStudy;
