import React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PathwayCardProps {
  title: string;
  description: string;
  cta: string;
  icon: React.ReactNode;
  variant: 'preclinical' | 'clinical';
  onClick: () => void;
}

/**
 * Entry point to a study pathway.
 *
 * The previous version stacked five simultaneous hover effects — a blurred
 * colour bloom, a translate, an elevated shadow, a gradient background and a
 * scaling gradient icon chip — and stood 320px tall, so two of them filled a
 * phone screen. Now the pathway colour appears once, as a tint on the icon and
 * a rule down the leading edge, and hover changes only border and surface.
 */
const PathwayCard: React.FC<PathwayCardProps> = ({
  title,
  description,
  cta,
  icon,
  variant,
  onClick,
}) => {
  const isPreclinical = variant === 'preclinical';

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative flex w-full items-start gap-4 overflow-hidden rounded-lg border border-border bg-card p-4 text-left',
        'transition-colors duration-150 hover:bg-muted/50 sm:p-5',
        isPreclinical ? 'hover:border-academic/60' : 'hover:border-medical/60',
      )}
    >
      {/* Leading rule: the pathway's colour, carrying identity without tinting
          the whole surface. */}
      <span
        aria-hidden="true"
        className={cn(
          'absolute inset-y-0 left-0 w-1',
          isPreclinical ? 'bg-academic' : 'bg-medical',
        )}
      />

      <span
        aria-hidden="true"
        className={cn(
          'ml-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-md',
          isPreclinical
            ? 'bg-academic/12 text-academic'
            : 'bg-medical/12 text-medical',
        )}
      >
        {icon}
      </span>

      <span className="min-w-0 flex-1">
        <span className="type-section-title block">{title}</span>
        <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
          {description}
        </span>
        <span
          className={cn(
            'mt-3 inline-flex items-center gap-1 text-sm font-medium',
            isPreclinical ? 'text-academic' : 'text-medical',
          )}
        >
          {cta}
          <ChevronRight
            aria-hidden="true"
            className="h-4 w-4 transition-transform duration-150 motion-safe:group-hover:translate-x-0.5"
          />
        </span>
      </span>
    </button>
  );
};

export default PathwayCard;
