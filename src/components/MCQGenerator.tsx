import React, { useState } from 'react';
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAIStatus } from '@/contexts/AIStatusContext';
import { callAI, type MCQResponse, type Difficulty, isErrorResponse } from '@/lib/aiClient';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MCQGeneratorProps {
  subject: string;
  variant?: 'preclinical' | 'clinical';
  systemKey?: string;
}

type Difficulty = 'easy' | 'medium' | 'hard';

interface MCQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

// Context-aware placeholder examples
const placeholderExamples: Record<string, { es: string; en: string }> = {
  // Preclinical
  anatomy: { es: 'Ej: plexo braquial, irrigación del corazón', en: 'E.g.: brachial plexus, cardiac blood supply' },
  histology: { es: 'Ej: epitelio glandular, tejido óseo', en: 'E.g.: glandular epithelium, bone tissue' },
  cellBiology: { es: 'Ej: ciclo celular, transporte de membrana', en: 'E.g.: cell cycle, membrane transport' },
  biochemistry: { es: 'Ej: glucólisis, metabolismo de lípidos', en: 'E.g.: glycolysis, lipid metabolism' },
  physiology: { es: 'Ej: potencial de acción, regulación de la presión arterial', en: 'E.g.: action potential, blood pressure regulation' },
  microbiology: { es: 'Ej: mecanismos de resistencia bacteriana', en: 'E.g.: bacterial resistance mechanisms' },
  parasitology: { es: 'Ej: ciclo de Plasmodium, giardiasis', en: 'E.g.: Plasmodium cycle, giardiasis' },
  immunology: { es: 'Ej: respuesta inmune celular, hipersensibilidad', en: 'E.g.: cellular immune response, hypersensitivity' },
  biostatistics: { es: 'Ej: prueba t de Student, odds ratio', en: 'E.g.: Student t-test, odds ratio' },
  pharmacology: { es: 'Ej: farmacocinética, interacciones medicamentosas', en: 'E.g.: pharmacokinetics, drug interactions' },
  // Clinical systems
  cardiovascular: { es: 'Ej: insuficiencia cardíaca descompensada, cardiopatía isquémica', en: 'E.g.: decompensated heart failure, ischemic heart disease' },
  respiratory: { es: 'Ej: neumonía adquirida en la comunidad, crisis asmática', en: 'E.g.: community-acquired pneumonia, asthma crisis' },
  endocrine: { es: 'Ej: cetoacidosis diabética, hipotiroidismo', en: 'E.g.: diabetic ketoacidosis, hypothyroidism' },
  gastrointestinal: { es: 'Ej: enfermedad por reflujo, pancreatitis aguda', en: 'E.g.: reflux disease, acute pancreatitis' },
  neurological: { es: 'Ej: accidente cerebrovascular, meningitis', en: 'E.g.: stroke, meningitis' },
  renal: { es: 'Ej: insuficiencia renal aguda, síndrome nefrótico', en: 'E.g.: acute kidney injury, nephrotic syndrome' },
  // Clinical rotations
  internalMedicine: { es: 'Ej: hipertensión arterial, diabetes mellitus', en: 'E.g.: hypertension, diabetes mellitus' },
  surgery: { es: 'Ej: apendicitis aguda, abdomen agudo', en: 'E.g.: acute appendicitis, acute abdomen' },
  pediatrics: { es: 'Ej: fiebre en lactante menor de 3 meses, deshidratación', en: 'E.g.: fever in infant under 3 months, dehydration' },
  gynecology: { es: 'Ej: preeclampsia, hemorragia postparto', en: 'E.g.: preeclampsia, postpartum hemorrhage' },
  generalMedicine: { es: 'Ej: dengue con signos de alarma, infecciones respiratorias', en: 'E.g.: dengue with warning signs, respiratory infections' },
};


const MCQGenerator: React.FC<MCQGeneratorProps> = ({ subject, variant = 'preclinical', systemKey }) => {
  const { t, language } = useLanguage();
  const { updateStatus } = useAIStatus();
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [question, setQuestion] = useState<MCQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get context-aware placeholder
  const getPlaceholder = () => {
    const key = systemKey || subject.toLowerCase().replace(/\s/g, '');
    const found = Object.entries(placeholderExamples).find(([k]) => 
      subject.toLowerCase().includes(t(k).toLowerCase()) || k === systemKey
    );
    return found ? found[1][language] : (language === 'es' ? 'Ej: tema específico a estudiar' : 'E.g.: specific topic to study');
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setError(null);
    
    try {
      const mode = variant === 'preclinical' ? 'preclinico' : 'clinico_estudio';
      const response = await callAI({
        tool: 'mcq',
        mode,
        language,
        input: topic || subject,
        context: {
          subject,
          system: systemKey,
          difficulty,
          topic: topic || undefined,
        },
      });

      updateStatus(true);

      if (isErrorResponse(response)) {
        throw new Error(response.error || 'Unknown error from AI service');
      }

      const mcq = response as MCQResponse;
      
      setQuestion({
        question: mcq.question,
        options: mcq.options,
        correctIndex: mcq.correctIndex,
        explanation: mcq.explanation,
      });
      
      setIsLoading(false);
    } catch (err: any) {
      updateStatus(false);
      const errorMessage = err.message || (language === 'es'
        ? 'Error al generar la pregunta. Por favor intenta de nuevo.'
        : 'Error generating question. Please try again.');
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    setShowExplanation(true);
  };

  // Use same academic blue for both variants
  const colorClass = 'bg-academic';

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="space-y-4 p-4 bg-card rounded-lg border border-border">
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-destructive font-medium">{error}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={handleGenerate}
                disabled={isLoading}
                className="mt-2 text-xs"
              >
                {language === 'es' ? 'Reintentar' : 'Retry'}
              </Button>
            </div>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {t('topicOptional')}
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={getPlaceholder()}
            disabled={isLoading}
            className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {t('difficulty')}
          </label>
          <div className="flex gap-2">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  difficulty === d
                    ? `${colorClass} text-white`
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {t(d)}
              </button>
            ))}
          </div>
        </div>
        
        <Button onClick={handleGenerate} disabled={isLoading} className="w-full">
          <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
          {isLoading ? t('generating') : t('generateQuestion')}
        </Button>
      </div>

      {/* Question Display */}
      {question && (
        <div className="space-y-4 p-4 bg-card rounded-lg border border-border animate-fade-in">
          <p className="text-foreground font-medium">{question.question}</p>
          
          <div className="space-y-2">
            {question.options.map((option, index) => {
              const isCorrect = index === question.correctIndex;
              const isSelected = index === selectedAnswer;
              
              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={selectedAnswer !== null}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-lg border transition-all flex items-center gap-3",
                    selectedAnswer === null && "hover:bg-muted cursor-pointer border-border",
                    isSelected && isCorrect && "bg-success/20 border-success",
                    isSelected && !isCorrect && "bg-destructive/20 border-destructive",
                    !isSelected && selectedAnswer !== null && isCorrect && "bg-success/10 border-success/50",
                    selectedAnswer !== null && !isSelected && !isCorrect && "opacity-50"
                  )}
                >
                  <span className="flex-shrink-0 w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-medium">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="flex-1 text-sm">{option}</span>
                  {selectedAnswer !== null && isCorrect && (
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                  )}
                  {isSelected && !isCorrect && (
                    <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
          
          {showExplanation && (
            <div className="p-4 bg-muted rounded-lg animate-fade-in">
              <p className="text-sm font-medium text-foreground mb-2">{t('explanation')}</p>
              <p className="text-sm text-muted-foreground">{question.explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MCQGenerator;
