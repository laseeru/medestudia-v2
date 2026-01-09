import React from 'react';
import { FileQuestion, Zap, BookOpen, BarChart3 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export type StudyTool = 'mcq' | 'quiz' | 'explain' | 'stats';

interface StudyToolSelectorProps {
  selectedTool: StudyTool | null;
  onSelectTool: (tool: StudyTool) => void;
  variant?: 'preclinical' | 'clinical';
}

const StudyToolSelector: React.FC<StudyToolSelectorProps> = ({
  selectedTool,
  onSelectTool,
  variant = 'preclinical',
}) => {
  const { t } = useLanguage();

  const tools = [
    { key: 'mcq' as StudyTool, icon: FileQuestion, label: t('generateMCQ'), desc: t('generateMCQDesc') },
    { key: 'quiz' as StudyTool, icon: Zap, label: t('quickQuiz'), desc: t('quickQuizDesc') },
    { key: 'explain' as StudyTool, icon: BookOpen, label: t('explainTopic'), desc: t('explainTopicDesc') },
    { key: 'stats' as StudyTool, icon: BarChart3, label: t('viewStats'), desc: t('viewStatsDesc') },
  ];

  // Use same academic blue for both variants
  const colorClass = 'text-academic';
  const bgClass = 'bg-academic/10 border-academic/30';
  const selectedBg = 'bg-academic/20 border-academic';

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {tools.map((tool) => (
        <button
          key={tool.key}
          onClick={() => onSelectTool(tool.key)}
          className={cn(
            "flex flex-col items-center gap-2 p-4 rounded-lg border transition-all duration-200 hover:scale-[1.02]",
            selectedTool === tool.key ? selectedBg : bgClass
          )}
        >
          <tool.icon className={cn("h-6 w-6", colorClass)} />
          <span className="text-sm font-medium text-foreground">{tool.label}</span>
          <span className="text-xs text-muted-foreground text-center hidden md:block">{tool.desc}</span>
        </button>
      ))}
    </div>
  );
};

export default StudyToolSelector;
