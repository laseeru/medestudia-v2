import React, { useState } from 'react';
import { Search, BookOpen, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAIStatus } from '@/contexts/AIStatusContext';
import { callAI, type ExplainResponse, isErrorResponse } from '@/lib/aiClient';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TopicExplainerProps {
  subject: string;
  mode: 'preclinical' | 'clinical-study';
  variant?: 'preclinical' | 'clinical';
  /**
   * Fired only after a valid explanation has actually rendered. Lets a quick
   * session gate its Next button on real completion instead of inspecting the
   * rendered output.
   */
  onExplanationLoaded?: () => void;
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

/** Section heading inside generated content — a rule and a label, not a box. */
const ContentSection: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <section className="border-t border-border pt-4">
    <h3 className="type-eyebrow mb-2">{title}</h3>
    {children}
  </section>
);

const TopicExplainer: React.FC<TopicExplainerProps> = ({
  subject,
  mode,
  variant = 'preclinical',
  onExplanationLoaded,
}) => {
  const { t, language } = useLanguage();
  const { updateStatus } = useAIStatus();
  const [topic, setTopic] = useState('');
  const [explanation, setExplanation] = useState<Explanation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPreclinical = variant === 'preclinical';

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
      const apiMode = mode === 'clinical-study' ? ('clinico_estudio' as const) : ('preclinico' as const);
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
      onExplanationLoaded?.();
    } catch (err: any) {
      updateStatus(false);
      const errorMessage = err.message || (language === 'es'
        ? 'Error al generar la explicación. Por favor intenta de nuevo.'
        : 'Error generating explanation. Please try again.');
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  // onKeyDown rather than the deprecated onKeyPress; same behaviour.
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleExplain();
    }
  };

  return (
    <div>
      {/* Query bar. Sits on the page rather than in a card: it is one field, and
          boxing it made the search look like a section of study content. */}
      <div>
        <label htmlFor="topic-input" className="mb-1.5 block text-sm font-medium text-foreground">
          {t('enterTopic')}
        </label>
        <div className="flex gap-2">
          <input
            id="topic-input"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={getPlaceholder()}
            disabled={isLoading}
            className="h-11 flex-1 rounded-md border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground/70 disabled:opacity-60"
          />
          <Button
            onClick={handleExplain}
            disabled={isLoading || !topic.trim()}
            className="h-11 shrink-0 px-4"
          >
            <Search className={cn('h-4 w-4', isLoading && 'animate-spin')} aria-hidden="true" />
            <span className="sr-only">{t('enterTopic')}</span>
          </Button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-foreground">{error}</p>
            <Button
              size="sm"
              variant="outline"
              onClick={handleExplain}
              disabled={isLoading || !topic.trim()}
              className="mt-2"
            >
              {language === 'es' ? 'Reintentar' : 'Retry'}
            </Button>
          </div>
        </div>
      )}

      {/* Generated explanation, laid out as a short article: a lead paragraph,
          then labelled sections divided by rules. Long-form text reads badly
          when every paragraph sits in its own bordered container. */}
      {explanation && (
        <article className="measure mt-8 animate-fade-in">
          <h2 className="type-page-title mb-3">{topic}</h2>

          <p className="type-prose">{explanation.definition}</p>

          <div className="mt-6 space-y-4">
            {explanation.keyFeatures.length > 0 && (
              <ContentSection title={t('keyFeatures')}>
                <ul className="space-y-2">
                  {explanation.keyFeatures.map((feature, idx) => (
                    <li key={idx} className="flex gap-2.5 type-prose">
                      <span
                        aria-hidden="true"
                        className={cn(
                          'mt-[0.6em] h-1 w-1 shrink-0 rounded-full',
                          isPreclinical ? 'bg-academic' : 'bg-medical',
                        )}
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </ContentSection>
            )}

            {explanation.diagnosticOverview && (
              <ContentSection title={t('diagnosticOverview')}>
                <p className="type-prose">{explanation.diagnosticOverview}</p>
              </ContentSection>
            )}

            {/* The one section that earns extra emphasis: what to do when the
                equipment or drug in the textbook is not available. */}
            {explanation.lowResourceConsiderations && (
              <section className="border-t border-border pt-4">
                <h3 className="type-eyebrow mb-2">{t('lowResourceConsiderations')}</h3>
                <p
                  className={cn(
                    'type-prose border-l-2 pl-3',
                    isPreclinical ? 'border-academic' : 'border-medical',
                  )}
                >
                  {explanation.lowResourceConsiderations}
                </p>
              </section>
            )}
          </div>

          <p className="mt-6 border-t border-border pt-3 text-xs text-muted-foreground">
            {t('representativeContent')}
          </p>
        </article>
      )}

      {!explanation && !isLoading && !error && (
        <div className="mt-10 flex flex-col items-start gap-2 text-muted-foreground">
          <BookOpen className="h-5 w-5 opacity-60" aria-hidden="true" />
          <p className="measure text-sm">{t('enterTopicPrompt')}</p>
        </div>
      )}

      {isLoading && (
        <div
          role="status"
          aria-live="polite"
          className="mt-10 flex items-center gap-2 text-sm text-muted-foreground"
        >
          <span
            aria-hidden="true"
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
          {t('generating')}
        </div>
      )}
    </div>
  );
};

export default TopicExplainer;
