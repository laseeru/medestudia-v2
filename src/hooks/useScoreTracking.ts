import { useState, useEffect, useCallback } from 'react';

interface QuizResult {
  id: string;
  subject: string;
  mode: 'preclinical' | 'clinical-study';
  score: number;
  totalQuestions: number;
  difficulty: 'easy' | 'medium' | 'hard';
  timestamp: number;
}

interface ScoreStats {
  totalQuizzes: number;
  averageScore: number;
  accuracy: number;
  recentResults: QuizResult[];
}

const STORAGE_KEY = 'medestudia_scores';

export const useScoreTracking = () => {
  const [results, setResults] = useState<QuizResult[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setResults(JSON.parse(stored));
      } catch {
        setResults([]);
      }
    }
  }, []);

  const saveResult = useCallback((result: Omit<QuizResult, 'id' | 'timestamp'>) => {
    const newResult: QuizResult = {
      ...result,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };
    
    setResults(prev => {
      const updated = [...prev, newResult];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
    
    return newResult;
  }, []);

  const getStats = useCallback((): ScoreStats => {
    if (results.length === 0) {
      return {
        totalQuizzes: 0,
        averageScore: 0,
        accuracy: 0,
        recentResults: [],
      };
    }

    const totalCorrect = results.reduce((sum, r) => sum + r.score, 0);
    const totalQuestions = results.reduce((sum, r) => sum + r.totalQuestions, 0);
    const averageScore = results.reduce((sum, r) => sum + (r.score / r.totalQuestions) * 100, 0) / results.length;

    return {
      totalQuizzes: results.length,
      averageScore: Math.round(averageScore),
      accuracy: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
      recentResults: results.slice(-10).reverse(),
    };
  }, [results]);

  const getSubjectStats = useCallback((subject: string) => {
    const subjectResults = results.filter(r => r.subject === subject);
    if (subjectResults.length === 0) return null;
    
    const totalCorrect = subjectResults.reduce((sum, r) => sum + r.score, 0);
    const totalQuestions = subjectResults.reduce((sum, r) => sum + r.totalQuestions, 0);
    
    return {
      quizzes: subjectResults.length,
      accuracy: Math.round((totalCorrect / totalQuestions) * 100),
    };
  }, [results]);

  const clearHistory = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setResults([]);
  }, []);

  return {
    results,
    saveResult,
    getStats,
    getSubjectStats,
    clearHistory,
  };
};
