import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  const handleSubjectSelect = (subjectKey: string) => {
    setSelectedSubject(subjectKey);
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

        {!selectedSubject ? (
          /* Subject Grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-w-5xl mx-auto animate-fade-in">
            {preclinicalSubjects.map((subject) => (
              <SubjectTile
                key={subject.key}
                title={t(subject.key)}
                icon={<subject.icon className="h-6 w-6" />}
                onClick={() => handleSubjectSelect(subject.key)}
                variant="preclinical"
              />
            ))}
          </div>
        ) : (
          /* Chat Interface */
          <div className="max-w-3xl mx-auto space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSelectedSubject(null)}
                className="text-sm text-academic hover:underline flex items-center gap-1"
              >
                ← {t('back')}
              </button>
              <span className="text-sm font-medium text-foreground">
                {t(selectedSubject)}
              </span>
            </div>
            <ChatInterface mode="preclinical" subject={t(selectedSubject)} />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Preclinical;
