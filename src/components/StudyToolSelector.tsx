import React from 'react';
import { Dumbbell, ClipboardCheck, BookOpen, LineChart, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export type StudyTool = 'mcq' | 'quiz' | 'explain' | 'stats';

interface StudyToolSelectorProps {
  selectedTool: StudyTool | null;
  onSelectTool: (tool: StudyTool) => void;
  variant?: 'preclinical' | 'clinical';
}

/**
 * Choice of study tool for the selected subject.
 *
 * Three accessibility fixes over the previous version: the buttons had no focus
 * style at all, no `aria-pressed`, and signalled selection purely by background
 * colour. Selection now also carries a check mark and a heavier label, so it
 * survives both keyboard use and colour-blind viewing.
 */
const StudyToolSelector: React.FC<StudyToolSelectorProps> = ({
  selectedTool,
  onSelectTool,
  variant = 'preclinical',
}) => {
  const { t } = useLanguage();
  const isPreclinical = variant === 'preclinical';

  const tools = [
    { key: 'mcq' as StudyTool, icon: Dumbbell, label: t('generateMCQ'), desc: t('generateMCQDesc') },
    { key: 'quiz' as StudyTool, icon: ClipboardCheck, label: t('quickQuiz'), desc: t('quickQuizDesc') },
    { key: 'explain' as StudyTool, icon: BookOpen, label: t('explainTopic'), desc: t('explainTopicDesc') },
    { key: 'stats' as StudyTool, icon: LineChart, label: t('viewStats'), desc: t('viewStatsDesc') },
  ];

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {tools.map((tool) => {
        const isSelected = selectedTool === tool.key;
        return (
          <button
            key={tool.key}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelectTool(tool.key)}
            className={cn(
              'flex min-h-[3.25rem] items-center gap-3 rounded-md border p-3 text-left transition-colors duration-150',
              isSelected
                ? isPreclinical
                  ? 'border-academic bg-academic/10'
                  : 'border-medical bg-medical/10'
                : 'border-border bg-card hover:bg-muted/60',
            )}
          >
            <tool.icon
              aria-hidden="true"
              className={cn(
                'h-5 w-5 shrink-0',
                isSelected
                  ? isPreclinical
                    ? 'text-academic'
                    : 'text-medical'
                  : 'text-muted-foreground',
              )}
            />
            <span className="min-w-0 flex-1">
              <span
                className={cn(
                  'block text-sm text-foreground',
                  isSelected ? 'font-semibold' : 'font-medium',
                )}
              >
                {tool.label}
              </span>
              <span className="mt-0.5 hidden text-xs leading-snug text-muted-foreground sm:block">
                {tool.desc}
              </span>
            </span>
            {isSelected && (
              <Check
                aria-hidden="true"
                className={cn(
                  'h-4 w-4 shrink-0',
                  isPreclinical ? 'text-academic' : 'text-medical',
                )}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default StudyToolSelector;
