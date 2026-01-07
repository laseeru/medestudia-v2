import React, { useState } from 'react';
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MCQGeneratorProps {
  subject: string;
  variant?: 'preclinical' | 'clinical';
}

type Difficulty = 'easy' | 'medium' | 'hard';

interface MCQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const MCQGenerator: React.FC<MCQGeneratorProps> = ({ subject, variant = 'preclinical' }) => {
  const { t, language } = useLanguage();
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [question, setQuestion] = useState<MCQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const generateMockQuestion = (): MCQuestion => {
    // Mock questions based on difficulty
    const questions: Record<Difficulty, MCQuestion[]> = {
      easy: [
        {
          question: language === 'es' 
            ? `¿Cuál es la función principal relacionada con ${topic || subject}?`
            : `What is the main function related to ${topic || subject}?`,
          options: language === 'es'
            ? ['Opción A - Respuesta correcta', 'Opción B - Incorrecta', 'Opción C - Incorrecta', 'Opción D - Incorrecta']
            : ['Option A - Correct answer', 'Option B - Incorrect', 'Option C - Incorrect', 'Option D - Incorrect'],
          correctIndex: 0,
          explanation: language === 'es'
            ? `La respuesta correcta es A. Esta es una explicación representativa sobre ${topic || subject}. [Contenido educativo de ejemplo]`
            : `The correct answer is A. This is a representative explanation about ${topic || subject}. [Sample educational content]`,
        },
      ],
      medium: [
        {
          question: language === 'es'
            ? `En el contexto de ${topic || subject}, ¿cuál de las siguientes afirmaciones es correcta?`
            : `In the context of ${topic || subject}, which of the following statements is correct?`,
          options: language === 'es'
            ? ['La primera opción es incorrecta', 'Esta es la respuesta correcta', 'Tercera opción incorrecta', 'Cuarta opción incorrecta']
            : ['The first option is incorrect', 'This is the correct answer', 'Third option is incorrect', 'Fourth option is incorrect'],
          correctIndex: 1,
          explanation: language === 'es'
            ? `La respuesta B es correcta porque aborda el concepto fundamental de ${topic || subject}. [Explicación detallada de ejemplo]`
            : `Answer B is correct because it addresses the fundamental concept of ${topic || subject}. [Detailed sample explanation]`,
        },
      ],
      hard: [
        {
          question: language === 'es'
            ? `Un paciente presenta un caso complejo relacionado con ${topic || subject}. ¿Cuál sería el enfoque más apropiado?`
            : `A patient presents with a complex case related to ${topic || subject}. What would be the most appropriate approach?`,
          options: language === 'es'
            ? ['Enfoque A - parcialmente correcto', 'Enfoque B - incompleto', 'Enfoque C - óptimo considerando todos los factores', 'Enfoque D - contraindicado']
            : ['Approach A - partially correct', 'Approach B - incomplete', 'Approach C - optimal considering all factors', 'Approach D - contraindicated'],
          correctIndex: 2,
          explanation: language === 'es'
            ? `La opción C es la más completa porque considera múltiples aspectos de ${topic || subject}. [Razonamiento clínico de ejemplo]`
            : `Option C is the most complete as it considers multiple aspects of ${topic || subject}. [Sample clinical reasoning]`,
        },
      ],
    };
    return questions[difficulty][0];
  };

  const handleGenerate = () => {
    setIsLoading(true);
    setSelectedAnswer(null);
    setShowExplanation(false);
    
    // Simulate API call
    setTimeout(() => {
      setQuestion(generateMockQuestion());
      setIsLoading(false);
    }, 1000);
  };

  const handleAnswerSelect = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    setShowExplanation(true);
  };

  const colorClass = variant === 'preclinical' ? 'bg-academic' : 'bg-medical';

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="space-y-4 p-4 bg-card rounded-lg border border-border">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {t('topicOptional')}
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={t('topicPlaceholder')}
            className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
