import React, { useState } from 'react';
import { Play, CheckCircle, XCircle, RotateCcw, Trophy } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useScoreTracking } from '@/hooks/useScoreTracking';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuickQuizProps {
  subject: string;
  mode: 'preclinical' | 'clinical-study';
  variant?: 'preclinical' | 'clinical';
}

type Difficulty = 'easy' | 'medium' | 'hard';

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const QuickQuiz: React.FC<QuickQuizProps> = ({ subject, mode, variant = 'preclinical' }) => {
  const { t, language } = useLanguage();
  const { saveResult } = useScoreTracking();
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const generateMockQuestions = (): QuizQuestion[] => {
    const baseQuestions = language === 'es' ? [
      `¿Cuál es la característica principal de ${topic || subject}?`,
      `En el contexto de ${topic || subject}, ¿qué afirmación es correcta?`,
      `¿Cuál es el mecanismo fundamental de ${topic || subject}?`,
      `¿Qué factor es más importante en ${topic || subject}?`,
      `¿Cuál es la aplicación clínica de ${topic || subject}?`,
    ] : [
      `What is the main characteristic of ${topic || subject}?`,
      `In the context of ${topic || subject}, which statement is correct?`,
      `What is the fundamental mechanism of ${topic || subject}?`,
      `What factor is most important in ${topic || subject}?`,
      `What is the clinical application of ${topic || subject}?`,
    ];

    return baseQuestions.map((q, i) => ({
      question: q,
      options: language === 'es'
        ? [`Opción A ${i === 0 ? '(correcta)' : ''}`, `Opción B ${i === 1 ? '(correcta)' : ''}`, `Opción C ${i === 2 || i === 3 ? '(correcta)' : ''}`, `Opción D ${i === 4 ? '(correcta)' : ''}`]
        : [`Option A ${i === 0 ? '(correct)' : ''}`, `Option B ${i === 1 ? '(correct)' : ''}`, `Option C ${i === 2 || i === 3 ? '(correct)' : ''}`, `Option D ${i === 4 ? '(correct)' : ''}`],
      correctIndex: i === 0 ? 0 : i === 1 ? 1 : i === 4 ? 3 : 2,
      explanation: language === 'es'
        ? `Explicación para la pregunta ${i + 1} sobre ${topic || subject}. [Contenido educativo representativo]`
        : `Explanation for question ${i + 1} about ${topic || subject}. [Representative educational content]`,
    }));
  };

  const handleStart = () => {
    setIsLoading(true);
    setTimeout(() => {
      setQuestions(generateMockQuestions());
      setAnswers(new Array(5).fill(null));
      setCurrentIndex(0);
      setSelectedAnswer(null);
      setIsStarted(true);
      setIsFinished(false);
      setIsLoading(false);
    }, 1000);
  };

  const handleAnswerSelect = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    const newAnswers = [...answers];
    newAnswers[currentIndex] = index;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    const score = answers.reduce((acc, ans, idx) => {
      return acc + (ans === questions[idx].correctIndex ? 1 : 0);
    }, 0);
    
    saveResult({
      subject,
      mode: mode === 'clinical-study' ? 'clinical-study' : 'preclinical',
      score,
      totalQuestions: questions.length,
      difficulty,
    });
    
    setIsFinished(true);
  };

  const handleRestart = () => {
    setIsStarted(false);
    setIsFinished(false);
    setQuestions([]);
    setAnswers([]);
    setCurrentIndex(0);
    setSelectedAnswer(null);
  };

  const colorClass = variant === 'preclinical' ? 'bg-academic' : 'bg-medical';
  const score = answers.reduce((acc, ans, idx) => acc + (ans === questions[idx]?.correctIndex ? 1 : 0), 0);

  if (!isStarted) {
    return (
      <div className="space-y-6 p-6 bg-card rounded-lg border border-border">
        <div className="text-center">
          <Trophy className="h-12 w-12 mx-auto text-warning mb-4" />
          <h3 className="text-lg font-serif font-bold text-foreground mb-2">{t('quickQuiz')}</h3>
          <p className="text-sm text-muted-foreground">{t('quickQuizIntro')}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">{t('topicOptional')}</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={t('topicPlaceholder')}
              className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">{t('difficulty')}</label>
            <div className="flex gap-2">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1",
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
        </div>

        <Button onClick={handleStart} disabled={isLoading} className="w-full">
          <Play className="h-4 w-4 mr-2" />
          {isLoading ? t('loading') : t('startQuiz')}
        </Button>
      </div>
    );
  }

  if (isFinished) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="space-y-6 p-6 bg-card rounded-lg border border-border animate-fade-in">
        <div className="text-center">
          <div className={cn(
            "inline-flex items-center justify-center w-20 h-20 rounded-full mb-4",
            percentage >= 80 ? "bg-success/20" : percentage >= 60 ? "bg-warning/20" : "bg-destructive/20"
          )}>
            <span className={cn(
              "text-2xl font-bold",
              percentage >= 80 ? "text-success" : percentage >= 60 ? "text-warning" : "text-destructive"
            )}>
              {percentage}%
            </span>
          </div>
          <h3 className="text-lg font-serif font-bold text-foreground mb-2">
            {percentage >= 80 ? t('excellent') : percentage >= 60 ? t('good') : t('keepPracticing')}
          </h3>
          <p className="text-muted-foreground">
            {score} / {questions.length} {t('correct')}
          </p>
        </div>

        <div className="space-y-3">
          {questions.map((q, idx) => (
            <div key={idx} className="p-3 bg-muted rounded-lg">
              <div className="flex items-start gap-2">
                {answers[idx] === q.correctIndex ? (
                  <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{q.question}</p>
                  <p className="text-xs text-muted-foreground mt-1">{q.explanation}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button onClick={handleRestart} className="w-full">
          <RotateCcw className="h-4 w-4 mr-2" />
          {t('tryAgain')}
        </Button>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="space-y-6 p-6 bg-card rounded-lg border border-border animate-fade-in">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {t('question')} {currentIndex + 1} / {questions.length}
        </span>
        <div className="flex gap-1">
          {questions.map((_, idx) => (
            <div
              key={idx}
              className={cn(
                "w-2 h-2 rounded-full",
                idx < currentIndex ? (answers[idx] === questions[idx].correctIndex ? "bg-success" : "bg-destructive")
                  : idx === currentIndex ? colorClass
                  : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      {/* Question */}
      <p className="text-foreground font-medium">{currentQuestion.question}</p>

      {/* Options */}
      <div className="space-y-2">
        {currentQuestion.options.map((option, index) => {
          const isCorrect = index === currentQuestion.correctIndex;
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
              {selectedAnswer !== null && isCorrect && <CheckCircle className="h-5 w-5 text-success" />}
              {isSelected && !isCorrect && <XCircle className="h-5 w-5 text-destructive" />}
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {selectedAnswer !== null && (
        <div className="p-4 bg-muted rounded-lg animate-fade-in">
          <p className="text-sm text-muted-foreground">{currentQuestion.explanation}</p>
        </div>
      )}

      {/* Next Button */}
      {selectedAnswer !== null && (
        <Button onClick={handleNext} className="w-full">
          {currentIndex < questions.length - 1 ? t('nextQuestion') : t('finishQuiz')}
        </Button>
      )}
    </div>
  );
};

export default QuickQuiz;
