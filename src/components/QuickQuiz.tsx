import React, { useEffect, useMemo, useState } from 'react';
import { Play, CheckCircle, XCircle, RotateCcw, Trophy, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAIStatus } from '@/contexts/AIStatusContext';
import { useScoreTracking } from '@/hooks/useScoreTracking';
import { callAI, type QuizResponse, isErrorResponse } from '@/lib/aiClient';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuickQuizProps {
  subject: string;
  mode: 'preclinical' | 'clinical-study';
  variant?: 'preclinical' | 'clinical';
  questionCount?: number;
}

type Difficulty = 'easy' | 'medium' | 'hard';

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const QUIZ_HISTORY_LIMIT = 200;

const getQuizHistoryKey = (
  subject: string,
  topic: string,
  difficulty: Difficulty,
  language: 'es' | 'en',
  mode: 'preclinical' | 'clinical-study'
) => {
  const normalizedTopic = (topic || subject).toLowerCase().trim().replace(/\s+/g, '-');
  return `medestudia_quiz_seen_${mode}_${language}_${difficulty}_${normalizedTopic}`;
};

const normalizeText = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const buildQuestionFingerprint = (question: QuizQuestion): string => {
  const normalizedQuestion = normalizeText(question.question)
    .split(' ')
    .filter((w) => w.length > 2)
    .slice(0, 14)
    .join(' ');
  const normalizedCorrect = normalizeText(question.options[question.correctIndex] || '');
  return `${normalizedQuestion}::${normalizedCorrect}`;
};

const loadSeenFingerprints = (key: string): string[] => {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveSeenFingerprints = (key: string, fingerprints: string[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(fingerprints.slice(-QUIZ_HISTORY_LIMIT)));
  } catch {
    // Ignore localStorage write errors
  }
};

const sanitizeQuestions = (questions: QuizResponse['questions']): QuizQuestion[] =>
  questions
    .filter(
      (q) =>
        Boolean(q?.question) &&
        Array.isArray(q?.options) &&
        q.options.length === 4 &&
        Number.isInteger(q.correctIndex) &&
        q.correctIndex >= 0 &&
        q.correctIndex < 4 &&
        Boolean(q?.explanation)
    )
    .map((q) => ({
      question: q.question.trim(),
      options: q.options.map((o) => o.trim()),
      correctIndex: q.correctIndex,
      explanation: q.explanation.trim(),
    }));

const dedupeQuestions = (questions: QuizQuestion[], seenFingerprints: Set<string>): QuizQuestion[] => {
  const unique: QuizQuestion[] = [];
  const localFingerprints = new Set<string>();

  for (const question of questions) {
    const fingerprint = buildQuestionFingerprint(question);
    if (!seenFingerprints.has(fingerprint) && !localFingerprints.has(fingerprint)) {
      unique.push(question);
      localFingerprints.add(fingerprint);
    }
  }

  return unique;
};

// Context-aware placeholder examples
const placeholderExamples: Record<string, { es: string; en: string }> = {
  cardiovascular: { es: 'Ej: insuficiencia cardíaca, hipertensión', en: 'E.g.: heart failure, hypertension' },
  respiratory: { es: 'Ej: neumonía, asma bronquial', en: 'E.g.: pneumonia, bronchial asthma' },
  endocrine: { es: 'Ej: diabetes mellitus, tiroides', en: 'E.g.: diabetes mellitus, thyroid' },
  gastrointestinal: { es: 'Ej: gastritis, pancreatitis', en: 'E.g.: gastritis, pancreatitis' },
  neurological: { es: 'Ej: ACV, cefaleas', en: 'E.g.: stroke, headaches' },
  pediatrics: { es: 'Ej: deshidratación, bronquiolitis', en: 'E.g.: dehydration, bronchiolitis' },
};


const QuickQuiz: React.FC<QuickQuizProps> = ({ subject, mode, variant = 'preclinical', questionCount = 5 }) => {
  const { t, language } = useLanguage();
  const { updateStatus } = useAIStatus();
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
  const [error, setError] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const recommendedSeconds = useMemo(() => questionCount * 35, [questionCount]);

  useEffect(() => {
    if (!isStarted || isFinished || !startedAt) return;
    const timer = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [isStarted, isFinished, startedAt]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const difficultyLabel = (d: Difficulty) => {
    const key = d === 'easy' ? 'basic' : d === 'medium' ? 'intermediate' : 'hard';
    return t(key);
  };

  // Get context-aware placeholder
  const getPlaceholder = () => {
    const found = Object.entries(placeholderExamples).find(([k]) => 
      subject.toLowerCase().includes(k)
    );
    return found ? found[1][language] : t('topicPlaceholder');
  };

  const handleStart = async () => {
    const quizTopic = topic.trim();
    if (!quizTopic) {
      setError(language === 'es'
        ? 'Ingresa un tema para iniciar la evaluación rápida.'
        : 'Enter a topic to start the rapid assessment.');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const apiMode = mode === 'clinical-study' ? 'clinico_estudio' : 'preclinico';
      const normalizedTopic = quizTopic;
      const historyKeyForTopic = getQuizHistoryKey(subject, normalizedTopic, difficulty, language, mode);
      const seenFromStorage = loadSeenFingerprints(historyKeyForTopic);
      const seenFingerprints = new Set(seenFromStorage);

      const fetchQuizBatch = async (avoidQuestions: string[] = []): Promise<QuizQuestion[]> => {
        const avoidText =
          avoidQuestions.length > 0
            ? language === 'es'
              ? `\nEvita preguntas iguales o casi iguales a estas:\n- ${avoidQuestions.join('\n- ')}`
              : `\nAvoid questions that are identical or very similar to these:\n- ${avoidQuestions.join('\n- ')}`
            : '';

        const response = await callAI({
          tool: 'quiz',
          mode: apiMode,
          language,
          input: `${quizTopic}${avoidText}`,
          context: {
            subject,
            difficulty,
            topic: quizTopic,
            questionCount,
          },
        });

        if (isErrorResponse(response)) {
          throw new Error(response.error || 'Unknown error from AI service');
        }

        const quiz = response as QuizResponse;
        if (!quiz.questions || quiz.questions.length === 0) {
          return [];
        }
        return sanitizeQuestions(quiz.questions);
      };

      const firstBatch = await fetchQuizBatch();
      let uniqueQuestions = dedupeQuestions(firstBatch, seenFingerprints);

      // Retry once with avoid list if we still don't have enough unique questions
      if (uniqueQuestions.length < questionCount) {
        const avoidQuestions = [
          ...uniqueQuestions.map((q) => q.question).slice(0, questionCount),
          ...firstBatch.map((q) => q.question).slice(0, questionCount),
        ];
        const secondBatch = await fetchQuizBatch(avoidQuestions);
        uniqueQuestions = dedupeQuestions([...uniqueQuestions, ...secondBatch], seenFingerprints);
      }

      if (uniqueQuestions.length < questionCount) {
        throw new Error(
          language === 'es'
            ? 'No se pudieron generar suficientes preguntas únicas. Intenta con otro tema.'
            : 'Could not generate enough unique questions. Try a different topic.'
        );
      }

      const quizQuestions = uniqueQuestions.slice(0, questionCount);
      const newFingerprints = quizQuestions.map((q) => buildQuestionFingerprint(q));
      saveSeenFingerprints(historyKeyForTopic, [...seenFromStorage, ...newFingerprints]);

      updateStatus(true);

      setQuestions(quizQuestions);
      setAnswers(new Array(quizQuestions.length).fill(null));
      setCurrentIndex(0);
      setSelectedAnswer(null);
      setIsStarted(true);
      setIsFinished(false);
      setStartedAt(Date.now());
      setElapsedSeconds(0);
      setIsLoading(false);
    } catch (err: any) {
      updateStatus(false);
      const errorMessage = err.message || (language === 'es'
        ? 'Error al generar el quiz. Por favor intenta de nuevo.'
        : 'Error generating quiz. Please try again.');
      setError(errorMessage);
      setIsLoading(false);
    }
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
    setStartedAt(null);
    setElapsedSeconds(0);
  };

  // Use academic blue for both variants
  const colorClass = 'bg-academic';
  const score = answers.reduce((acc, ans, idx) => acc + (ans === questions[idx]?.correctIndex ? 1 : 0), 0);

  if (!isStarted) {
    return (
      <div className="space-y-6 p-6 bg-card rounded-lg border border-border">
        <div className="text-center">
          <Trophy className="h-12 w-12 mx-auto text-warning mb-4" />
          <h3 className="text-lg font-serif font-bold text-foreground mb-2">{t('quickQuiz')}</h3>
          <p className="text-sm text-muted-foreground">
            {variant === 'preclinical'
              ? language === 'es'
                ? `${questionCount} preguntas con retroalimentación al final`
                : `${questionCount} questions with end-of-test feedback`
              : t('quickQuizIntro')}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-destructive font-medium">{error}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={handleStart}
                disabled={isLoading}
                className="mt-2 text-xs"
              >
                {language === 'es' ? 'Reintentar' : 'Retry'}
              </Button>
            </div>
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">{t('topicOptional')}</label>
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
                {difficultyLabel(d)}
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
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {t('elapsedTime')}: {formatDuration(elapsedSeconds)}
          </span>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {t('recommendedPace')}: ~{formatDuration(recommendedSeconds)}
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
