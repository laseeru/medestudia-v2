import React, { useState } from 'react';
import { Search, BookOpen, Lightbulb, Stethoscope, Globe, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAIStatus } from '@/contexts/AIStatusContext';
import { callAI, type ExplainResponse, isErrorResponse } from '@/lib/aiClient';
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
  const { updateStatus } = useAIStatus();
  const [topic, setTopic] = useState('');
  const [explanation, setExplanation] = useState<Explanation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get context-aware placeholder
  const getPlaceholder = () => {
    const found = Object.entries(placeholderExamples).find(([k]) => 
      subject.toLowerCase().includes(k) || subject.toLowerCase().includes(t(k).toLowerCase())
    );
    return found ? found[1][language] : t('topicExamplePlaceholder');
  };

  const handleExplain = async () => {
    if (!topic.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setExplanation(null);
    
    try {
      const apiMode = mode === 'clinical-study' ? 'clinico_estudio' : 'preclinico';
      const request = {
        tool: 'explain' as const,
        mode: apiMode,
        language,
        input: topic.trim(),
        context: {
          subject,
          topic: topic.trim(),
        },
      };

      // For explain tool, use regular call (needs structured JSON)
      const response = await callAI(request);

      if (isErrorResponse(response)) {
        throw new Error(response.error || 'Unknown error from AI service');
      }

      const explain = response as ExplainResponse;
      
      setExplanation({
        definition: explain.definition,
        keyFeatures: explain.keyFeatures || [],
        diagnosticOverview: explain.diagnosis || explain.managementBasics,
        lowResourceConsiderations: explain.lowResourceConsiderations,
      });

      updateStatus(true);
      setIsLoading(false);
    } catch (err: any) {
      updateStatus(false);
      const errorMessage = err.message || (language === 'es'
        ? 'Error al generar la explicación. Por favor intenta de nuevo.'
        : 'Error generating explanation. Please try again.');
      setError(errorMessage);
      setIsLoading(false);
    }
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
        {error && (
          <div className="mb-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-destructive font-medium">{error}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={handleExplain}
                disabled={isLoading || !topic.trim()}
                className="mt-2 text-xs"
              >
                {language === 'es' ? 'Reintentar' : 'Retry'}
              </Button>
            </div>
          </div>
        )}
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
            disabled={isLoading}
            className="flex-1 rounded-lg border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <Button onClick={handleExplain} disabled={isLoading || !topic.trim()}>
            <Search className={cn("h-4 w-4", isLoading && "animate-spin")} />
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
