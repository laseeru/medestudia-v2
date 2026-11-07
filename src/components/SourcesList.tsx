import { BookOpen, BookX } from 'lucide-react';
import type { SourceRef } from '@/lib/aiClient';
import { cn } from '@/lib/utils';

interface SourcesListProps {
  /** undefined = response predates retrieval or tool is not grounded → render nothing. */
  grounded?: boolean;
  sources?: SourceRef[];
  language: 'es' | 'en';
  className?: string;
}

/**
 * Shows which textbook passages a response was built from. Cited passages
 * (the [S#] markers in the text) are listed first; retrieved-but-uncited ones
 * are dimmed so students can see what the model had available.
 */
export function SourcesList({ grounded, sources, language, className }: SourcesListProps) {
  const es = language === 'es';

  if (grounded === false) {
    return (
      <p className={cn('mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground', className)}>
        <BookX className="h-3.5 w-3.5 shrink-0" aria-hidden />
        {es
          ? 'Sin fragmentos pertinentes en los libros de texto: respuesta sin fuentes verificables.'
          : 'No relevant textbook passages found: this answer has no verifiable sources.'}
      </p>
    );
  }
  if (!sources?.length) return null;

  const ordered = [...sources].sort((a, b) => Number(b.cited) - Number(a.cited));
  const citedCount = sources.filter((s) => s.cited).length;

  return (
    <details className={cn('mt-2 rounded-lg border border-border/60 bg-background/50 text-xs', className)}>
      <summary className="flex cursor-pointer select-none items-center gap-1.5 px-3 py-2 font-medium text-muted-foreground">
        <BookOpen className="h-3.5 w-3.5 shrink-0" aria-hidden />
        {es
          ? `Fuentes: ${citedCount} citada${citedCount === 1 ? '' : 's'} de ${sources.length} consultadas`
          : `Sources: ${citedCount} cited of ${sources.length} retrieved`}
      </summary>
      <ul className="space-y-2 px-3 pb-3">
        {ordered.map((s) => (
          <li key={s.label} className={cn('leading-snug', !s.cited && 'opacity-60')}>
            <span className="mr-1 rounded bg-academic/10 px-1 font-mono text-[10px] text-academic">{s.label}</span>
            <span className="font-medium">{s.title}</span>
            {s.section && <span className="text-muted-foreground"> — {s.section}</span>}
            {!s.cited && <span className="text-muted-foreground"> {es ? '(no citada)' : '(not cited)'}</span>}
            <p className="mt-0.5 text-muted-foreground">“{s.excerpt}”</p>
          </li>
        ))}
      </ul>
      <p className="border-t border-border/60 px-3 py-2 text-[10px] text-muted-foreground">
        {es
          ? 'Fragmentos de libros de texto digitalizados; pueden contener errores de escaneo. Verifica siempre con la fuente y las guías oficiales.'
          : 'Excerpts from scanned textbooks; they may contain scanning errors. Always verify against the source and official guidelines.'}
      </p>
    </details>
  );
}
