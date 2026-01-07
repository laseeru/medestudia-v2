import React, { useState } from 'react';
import { Search, BookOpen, Lightbulb, Stethoscope, Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TopicExplainerProps {
  subject: string;
  mode: 'preclinical' | 'clinical-study';
  variant?: 'preclinical' | 'clinical';
}

interface Explanation {
  definition: string;
  keyFeatures: string[];
  diagnosticOverview?: string;
  lowResourceConsiderations?: string;
}

const TopicExplainer: React.FC<TopicExplainerProps> = ({ subject, mode, variant = 'preclinical' }) => {
  const { t, language } = useLanguage();
  const [topic, setTopic] = useState('');
  const [explanation, setExplanation] = useState<Explanation | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateMockExplanation = (): Explanation => {
    if (language === 'es') {
      return {
        definition: `${topic || subject} es un concepto fundamental en medicina que abarca múltiples aspectos de la práctica clínica y la investigación. Su comprensión es esencial para el diagnóstico y tratamiento adecuado de diversas condiciones médicas. [Contenido representativo]`,
        keyFeatures: [
          'Mecanismo fisiopatológico principal y su relevancia clínica',
          'Manifestaciones clínicas características y presentación típica',
          'Métodos diagnósticos recomendados según recursos disponibles',
          'Opciones terapéuticas basadas en evidencia actual',
          'Consideraciones especiales para poblaciones vulnerables',
        ],
        diagnosticOverview: mode === 'clinical-study'
          ? 'El enfoque diagnóstico debe incluir una historia clínica detallada, examen físico completo y estudios complementarios según disponibilidad. La correlación clínico-patológica es fundamental para un diagnóstico preciso.'
          : undefined,
        lowResourceConsiderations: 'En contextos de recursos limitados, se recomienda priorizar métodos diagnósticos clínicos y utilizar escalas validadas. El juicio clínico combinado con herramientas básicas puede lograr una alta precisión diagnóstica.',
      };
    } else {
      return {
        definition: `${topic || subject} is a fundamental concept in medicine that encompasses multiple aspects of clinical practice and research. Its understanding is essential for proper diagnosis and treatment of various medical conditions. [Representative content]`,
        keyFeatures: [
          'Main pathophysiological mechanism and its clinical relevance',
          'Characteristic clinical manifestations and typical presentation',
          'Recommended diagnostic methods according to available resources',
          'Evidence-based therapeutic options',
          'Special considerations for vulnerable populations',
        ],
        diagnosticOverview: mode === 'clinical-study'
          ? 'The diagnostic approach should include a detailed clinical history, complete physical examination, and complementary studies as available. Clinical-pathological correlation is fundamental for accurate diagnosis.'
          : undefined,
        lowResourceConsiderations: 'In low-resource settings, prioritizing clinical diagnostic methods and using validated scales is recommended. Clinical judgment combined with basic tools can achieve high diagnostic accuracy.',
      };
    }
  };

  const handleExplain = () => {
    if (!topic.trim()) return;
    
    setIsLoading(true);
    setTimeout(() => {
      setExplanation(generateMockExplanation());
      setIsLoading(false);
    }, 1200);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleExplain();
    }
  };

  const colorClass = variant === 'preclinical' ? 'text-academic' : 'text-medical';
  const bgClass = variant === 'preclinical' ? 'bg-academic/10' : 'bg-medical/10';

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="p-4 bg-card rounded-lg border border-border">
        <label className="block text-sm font-medium text-foreground mb-2">
          {t('enterTopic')}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('topicExamplePlaceholder')}
            className="flex-1 rounded-lg border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button onClick={handleExplain} disabled={isLoading || !topic.trim()}>
            <Search className={cn("h-4 w-4", isLoading && "animate-pulse")} />
          </Button>
        </div>
      </div>

      {/* Explanation Display */}
      {explanation && (
        <div className="space-y-4 animate-fade-in">
          {/* Definition */}
          <div className="p-4 bg-card rounded-lg border border-border">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className={cn("h-5 w-5", colorClass)} />
              <h3 className="font-medium text-foreground">{t('definition')}</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{explanation.definition}</p>
          </div>

          {/* Key Features */}
          <div className="p-4 bg-card rounded-lg border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className={cn("h-5 w-5", colorClass)} />
              <h3 className="font-medium text-foreground">{t('keyFeatures')}</h3>
            </div>
            <ul className="space-y-2">
              {explanation.keyFeatures.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className={cn("mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0", variant === 'preclinical' ? 'bg-academic' : 'bg-medical')} />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Diagnostic Overview (Clinical only) */}
          {explanation.diagnosticOverview && (
            <div className="p-4 bg-card rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-3">
                <Stethoscope className={cn("h-5 w-5", colorClass)} />
                <h3 className="font-medium text-foreground">{t('diagnosticOverview')}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{explanation.diagnosticOverview}</p>
            </div>
          )}

          {/* Low Resource Considerations */}
          <div className={cn("p-4 rounded-lg border border-border", bgClass)}>
            <div className="flex items-center gap-2 mb-3">
              <Globe className={cn("h-5 w-5", colorClass)} />
              <h3 className="font-medium text-foreground">{t('lowResourceConsiderations')}</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{explanation.lowResourceConsiderations}</p>
          </div>

          {/* Educational Disclaimer */}
          <p className="text-xs text-center text-muted-foreground">
            [{t('representativeContent')}]
          </p>
        </div>
      )}

      {/* Empty State */}
      {!explanation && !isLoading && (
        <div className="text-center py-8 text-muted-foreground">
          <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-sm">{t('enterTopicPrompt')}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-2 text-muted-foreground">
            <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">{t('generating')}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopicExplainer;
