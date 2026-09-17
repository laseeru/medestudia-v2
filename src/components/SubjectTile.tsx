import React from 'react';
import { cn } from '@/lib/utils';

interface SubjectTileProps {
  title: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'preclinical' | 'clinical';
}

/**
 * One subject, rotation or system in a selection grid.
 *
 * Kept deliberately quiet: these appear ten or more at a time, so any shadow or
 * scale per tile becomes noise at grid scale. Height came down from 140px to a
 * padding-driven ~92px, which fits the whole preclinical grid on a phone
 * without scrolling.
 */
const SubjectTile: React.FC<SubjectTileProps> = ({
  title,
  icon,
  onClick,
  variant = 'preclinical',
}) => {
  const isPreclinical = variant === 'preclinical';

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex min-h-[5.75rem] flex-col items-start justify-start gap-2 rounded-md border border-border bg-card p-3 text-left',
        'transition-colors duration-150 hover:bg-muted/60',
        isPreclinical ? 'hover:border-academic/60' : 'hover:border-medical/60',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded transition-colors duration-150',
          isPreclinical
            ? 'bg-academic/12 text-academic'
            : 'bg-medical/12 text-medical',
        )}
      >
        {icon}
      </span>
      <span className="text-sm font-medium leading-tight text-foreground">
        {title}
      </span>
    </button>
  );
};

export default SubjectTile;
