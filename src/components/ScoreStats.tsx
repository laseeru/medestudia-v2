import React from 'react';
import { Trophy, Target, TrendingUp, Trash2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useScoreTracking } from '@/hooks/useScoreTracking';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ScoreStatsProps {
  variant?: 'preclinical' | 'clinical';
}

const ScoreStats: React.FC<ScoreStatsProps> = ({ variant = 'preclinical' }) => {
  const { t, language } = useLanguage();
  const { getStats, clearHistory } = useScoreTracking();
  const stats = getStats();

  const colorClass = variant === 'preclinical' ? 'text-academic' : 'text-medical';
  const bgClass = variant === 'preclinical' ? 'bg-academic/10' : 'bg-medical/10';

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (stats.totalQuizzes === 0) {
    return (
      <div className="p-6 bg-card rounded-lg border border-border text-center">
        <Trophy className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
        <h3 className="font-medium text-foreground mb-2">{t('noStatsYet')}</h3>
        <p className="text-sm text-muted-foreground">{t('completeQuizPrompt')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className={cn("p-4 rounded-lg border border-border", bgClass)}>
          <Trophy className={cn("h-6 w-6 mb-2", colorClass)} />
          <p className="text-2xl font-bold text-foreground">{stats.totalQuizzes}</p>
          <p className="text-xs text-muted-foreground">{t('quizzesTaken')}</p>
        </div>
        
        <div className={cn("p-4 rounded-lg border border-border", bgClass)}>
          <Target className={cn("h-6 w-6 mb-2", colorClass)} />
          <p className="text-2xl font-bold text-foreground">{stats.accuracy}%</p>
          <p className="text-xs text-muted-foreground">{t('accuracy')}</p>
        </div>
        
        <div className={cn("p-4 rounded-lg border border-border", bgClass)}>
          <TrendingUp className={cn("h-6 w-6 mb-2", colorClass)} />
          <p className="text-2xl font-bold text-foreground">{stats.averageScore}%</p>
          <p className="text-xs text-muted-foreground">{t('avgScore')}</p>
        </div>
      </div>

      {/* Recent Results */}
      <div className="p-4 bg-card rounded-lg border border-border">
        <h3 className="font-medium text-foreground mb-4">{t('recentResults')}</h3>
        <div className="space-y-3">
          {stats.recentResults.map((result) => {
            const percentage = Math.round((result.score / result.totalQuestions) * 100);
            return (
              <div key={result.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{result.subject}</p>
                  <p className="text-xs text-muted-foreground">
                    {t(result.difficulty)} • {formatDate(result.timestamp)}
                  </p>
                </div>
                <div className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium",
                  percentage >= 80 ? "bg-success/20 text-success" :
                  percentage >= 60 ? "bg-warning/20 text-warning" :
                  "bg-destructive/20 text-destructive"
                )}>
                  {result.score}/{result.totalQuestions}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Clear History */}
      <Button
        variant="outline"
        className="w-full text-muted-foreground"
        onClick={() => {
          if (confirm(language === 'es' ? '¿Borrar todo el historial?' : 'Clear all history?')) {
            clearHistory();
          }
        }}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        {t('clearHistory')}
      </Button>
    </div>
  );
};

export default ScoreStats;
