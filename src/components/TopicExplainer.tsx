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

// Context-aware placeholder examples
const placeholderExamples: Record<string, { es: string; en: string }> = {
  // Preclinical
  anatomy: { es: 'Ej: plexo braquial, polígono de Willis', en: 'E.g.: brachial plexus, circle of Willis' },
  histology: { es: 'Ej: tejido cartilaginoso, epitelio respiratorio', en: 'E.g.: cartilaginous tissue, respiratory epithelium' },
  physiology: { es: 'Ej: curva de Frank-Starling, equilibrio ácido-base', en: 'E.g.: Frank-Starling curve, acid-base balance' },
  biochemistry: { es: 'Ej: ciclo de Krebs, síntesis de proteínas', en: 'E.g.: Krebs cycle, protein synthesis' },
  pharmacology: { es: 'Ej: mecanismo de acción de los IECA', en: 'E.g.: ACE inhibitor mechanism of action' },
  // Clinical
  cardiovascular: { es: 'Ej: fisiopatología de la hipertensión', en: 'E.g.: pathophysiology of hypertension' },
  respiratory: { es: 'Ej: síndrome de distrés respiratorio', en: 'E.g.: respiratory distress syndrome' },
  pediatrics: { es: 'Ej: desarrollo psicomotor, lactancia materna', en: 'E.g.: psychomotor development, breastfeeding' },
};

const TopicExplainer: React.FC<TopicExplainerProps> = ({ subject, mode, variant = 'preclinical' }) => {
  const { t, language } = useLanguage();
  const [topic, setTopic] = useState('');
  const [explanation, setExplanation] = useState<Explanation | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get context-aware placeholder
  const getPlaceholder = () => {
    const found = Object.entries(placeholderExamples).find(([k]) => 
      subject.toLowerCase().includes(k) || subject.toLowerCase().includes(t(k).toLowerCase())
    );
    return found ? found[1][language] : t('topicExamplePlaceholder');
  };

  const generateMockExplanation = (): Explanation => {
    // Generate explanation that references the user's query
    const userTopic = topic.trim();
    
    if (language === 'es') {
      return {
        definition: `${userTopic} es un tema fundamental en ${subject}. Su comprensión permite integrar conceptos básicos con aplicaciones clínicas relevantes para la práctica médica en el contexto cubano y latinoamericano. Este contenido es representativo y será actualizado con material curricular oficial.`,
        keyFeatures: [
          `Bases fisiopatológicas de ${userTopic} y su relevancia clínica`,
          'Manifestaciones clínicas características según la presentación típica regional',
          'Métodos diagnósticos recomendados considerando disponibilidad de recursos',
          'Opciones terapéuticas basadas en guías OPS/OMS adaptadas al contexto local',
          'Consideraciones especiales para poblaciones vulnerables en el entorno cubano',
        ],
        diagnosticOverview: mode === 'clinical-study'
          ? `El enfoque diagnóstico de ${userTopic} debe priorizar la historia clínica detallada y el examen físico como herramientas fundamentales, especialmente en atención primaria. Los estudios complementarios deben solicitarse de manera racional según disponibilidad y necesidad clínica.`
          : undefined,
        lowResourceConsiderations: `En el contexto de la medicina cubana, se recomienda maximizar el uso de la semiología clínica y escalas validadas para ${userTopic}. El razonamiento clínico sólido, combinado con herramientas diagnósticas básicas, permite lograr alta precisión diagnóstica incluso con recursos limitados.`,
      };
    } else {
      return {
        definition: `${userTopic} is a fundamental topic in ${subject}. Its understanding allows integrating basic concepts with clinical applications relevant to medical practice in the Cuban and Latin American context. This content is representative and will be updated with official curricular material.`,
        keyFeatures: [
          `Pathophysiological basis of ${userTopic} and its clinical relevance`,
          'Characteristic clinical manifestations according to typical regional presentation',
          'Recommended diagnostic methods considering resource availability',
          'Therapeutic options based on PAHO/WHO guidelines adapted to local context',
          'Special considerations for vulnerable populations in the Cuban setting',
        ],
        diagnosticOverview: mode === 'clinical-study'
          ? `The diagnostic approach to ${userTopic} should prioritize detailed clinical history and physical examination as fundamental tools, especially in primary care. Complementary studies should be requested rationally according to availability and clinical need.`
          : undefined,
        lowResourceConsiderations: `In the context of Cuban medicine, maximizing the use of clinical semiology and validated scales for ${userTopic} is recommended. Solid clinical reasoning, combined with basic diagnostic tools, achieves high diagnostic accuracy even with limited resources.`,
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

  // Use academic blue for both variants
  const colorClass = 'text-academic';
  const bgClass = 'bg-academic/10';
  const bulletClass = 'bg-academic';

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
            placeholder={getPlaceholder()}
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
                  <span className={cn("mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0", bulletClass)} />
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
