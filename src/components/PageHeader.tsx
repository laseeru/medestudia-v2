import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Small uppercase label above the title, for context such as the pathway. */
  eyebrow?: string;
  /** Low-emphasis qualifier shown under the description (e.g. educational-use). */
  note?: React.ReactNode;
  /** Optional trailing controls, aligned to the title baseline on wide screens. */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * The single page-title treatment for the study screens.
 *
 * Every page previously centred its own title, subtitle and a pill badge, which
 * read as a sequence of small landing pages and gave the eye no consistent
 * anchor. Left alignment puts the title where reading starts and lets the
 * content below share one edge.
 */
const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  eyebrow,
  note,
  actions,
  className,
}) => (
  <div className={cn('mb-6 sm:mb-8', className)}>
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        {eyebrow && <p className="type-eyebrow mb-1.5">{eyebrow}</p>}
        <h1 className="type-page-title">{title}</h1>
        {description && (
          <p className="measure mt-1.5 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
    {note && <div className="mt-3">{note}</div>}
  </div>
);

export default PageHeader;
