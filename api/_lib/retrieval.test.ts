import { describe, it, expect } from 'vitest';
import {
  citedLabels,
  stripInvalidMarkers,
  cleanMarkersDeep,
  buildSourceRefs,
  formatPassages,
  type Passage,
} from './retrieval';
import { isCorrupt } from '../../rag/embed.mjs';

const passage = (label: string, over: Partial<Passage> = {}): Passage => ({
  id: `book_${label}`,
  title: 'Medicina Interna, Tomo I',
  subject: 'internal_medicine',
  section: 'Tratamiento',
  chunk_index: 1,
  content: 'x'.repeat(300),
  similarity: 0.61234,
  label,
  ...over,
});

describe('citedLabels', () => {
  it('finds single and grouped markers', () => {
    expect([...citedLabels('A [S1]. B [S2, S4]. C[S3]')].sort()).toEqual(['S1', 'S2', 'S3', 'S4']);
  });
  it('ignores non-marker brackets', () => {
    expect(citedLabels('dosis [1] y [SS2] y [S]').size).toBe(0);
  });
});

describe('stripInvalidMarkers', () => {
  const valid = new Set(['S1', 'S2']);
  it('keeps valid markers untouched', () => {
    expect(stripInvalidMarkers('Hecho [S1].', valid)).toBe('Hecho [S1].');
  });
  it('removes invented markers with their leading space', () => {
    expect(stripInvalidMarkers('Hecho [S9].', valid)).toBe('Hecho.');
  });
  it('filters a group down to valid labels', () => {
    expect(stripInvalidMarkers('Hecho [S1, S7, S2].', valid)).toBe('Hecho [S1, S2].');
  });
});

describe('cleanMarkersDeep', () => {
  it('cleans every string inside nested JSON without changing structure', () => {
    const input = { question: 'Q [S5]', options: ['a [S1]', 'b'], correctIndex: 0, nested: { e: 'x [S2, S8]' } };
    expect(cleanMarkersDeep(input, new Set(['S1', 'S2']))).toEqual({
      question: 'Q',
      options: ['a [S1]', 'b'],
      correctIndex: 0,
      nested: { e: 'x [S2]' },
    });
  });
});

describe('buildSourceRefs', () => {
  it('flags cited passages, rounds similarity and truncates excerpts', () => {
    const refs = buildSourceRefs([passage('S1'), passage('S2')], new Set(['S2']));
    expect(refs.map((r) => r.cited)).toEqual([false, true]);
    expect(refs[0].similarity).toBe(0.612);
    expect(refs[0].excerpt.length).toBeLessThanOrEqual(221);
    expect(refs[0].excerpt.endsWith('…')).toBe(true);
  });
});

describe('formatPassages', () => {
  it('labels each passage with its marker, title and section', () => {
    const out = formatPassages([passage('S1', { content: 'Texto corto.' })]);
    expect(out).toBe('[S1] Medicina Interna, Tomo I — Tratamiento\nTexto corto.');
  });
});

describe('isCorrupt (ingestion filter)', () => {
  it('flags NUL bytes and non-Spanish Latin-1 letters', () => {
    expect(isCorrupt('texto\u0000roto')).toBe(true);
    expect(isCorrupt('la funciÛn renal')).toBe(true);
  });
  it('keeps ordinary Spanish text with accents, ñ and ü', () => {
    expect(isCorrupt('Insuficiencia cardíaca en el niño; pingüino; ÁÉÍÓÚÑÜ')).toBe(false);
  });
});
