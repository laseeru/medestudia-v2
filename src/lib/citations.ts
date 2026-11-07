import type { SourceRef } from '@/lib/aiClient';

/** Labels like S1, S3 cited anywhere in the given texts ("[S1]" or "[S1, S3]"). */
export function citedInTexts(texts: string[]): string[] {
  const out = new Set<string>();
  for (const t of texts) {
    for (const m of t.matchAll(/\[(S\d{1,2}(?:\s*,\s*S\d{1,2})*)\]/g)) {
      m[1].split(',').forEach((l) => out.add(l.trim()));
    }
  }
  return [...out];
}

/** Mark cited flags after a stream finishes. */
export function applyCitations(sources: SourceRef[] | undefined, cited: string[] | undefined): SourceRef[] | undefined {
  if (!sources) return sources;
  const set = new Set(cited ?? []);
  return sources.map((s) => ({ ...s, cited: set.has(s.label) }));
}
