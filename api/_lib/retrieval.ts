/**
 * Retrieval over the MedEstudia textbook corpus (Supabase pgvector).
 *
 * Files under api/_lib are helpers, not routes (Vercel skips "_"-prefixed paths).
 *
 * Flow: query text → Azure OpenAI embedding (text-embedding-3-small, 512 dims,
 * same model/dimension as rag/embed.mjs) → match_rag_chunks RPC → passages
 * labelled [S1]..[Sk] for the prompt. After generation, citation markers are
 * checked against the retrieved set; markers that point nowhere are removed.
 */

import { resolveEmbedEndpoint } from './embedEndpoint.js';

declare const process: { env: Record<string, string | undefined> };

export const EMBED_DIMENSIONS = 512;
const RETRIEVAL_TIMEOUT_MS = 5000;
const PASSAGE_MAX_CHARS = 1200;
const EXCERPT_CHARS = 220;

export interface RetrievedChunk {
  id: string;
  title: string;
  subject: string | null;
  section: string | null;
  chunk_index: number;
  content: string;
  similarity: number;
}

export interface Passage extends RetrievedChunk {
  label: string; // "S1", "S2", ...
}

/** What the client receives about each retrieved passage. */
export interface SourceRef {
  label: string;
  title: string;
  section: string | null;
  chunkId: string;
  similarity: number;
  excerpt: string;
  cited: boolean;
}

export interface RetrievalResult {
  passages: Passage[];
  error?: string;
}

export function retrievalConfigured(): boolean {
  const env = process.env;
  return Boolean(
    env.RAG_ENABLED !== 'false' &&
      env.AZURE_OPENAI_EMBED_ENDPOINT &&
      (env.AZURE_OPENAI_EMBED_KEY || env.AZURE_FOUNDRY_API_KEY) &&
      env.VITE_SUPABASE_URL &&
      env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export function minSimilarity(): number {
  const v = Number(process.env.RAG_MIN_SIMILARITY);
  // 0.50: full-index check (7 Nov 2026, 17 queries): on-topic top-5 passages 0.62–0.74,
  // off-topic top-1 0.25–0.41 (see docs/research/retrieval-design.md). Recalibrate after S4-3.
  return Number.isFinite(v) && v > 0 ? v : 0.5;
}

async function withTimeout<T>(p: (signal: AbortSignal) => Promise<T>, ms: number): Promise<T> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  try {
    return await p(controller.signal);
  } finally {
    clearTimeout(t);
  }
}

export async function embedQuery(text: string, signal?: AbortSignal): Promise<number[]> {
  const res = await fetch(resolveEmbedEndpoint(process.env), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': (process.env.AZURE_OPENAI_EMBED_KEY || process.env.AZURE_FOUNDRY_API_KEY) as string,
    },
    body: JSON.stringify({ input: [text], dimensions: EMBED_DIMENSIONS }),
    signal,
  });
  if (!res.ok) throw new Error(`embedding ${res.status}`);
  const json = await res.json();
  const vec = json?.data?.[0]?.embedding;
  if (!Array.isArray(vec) || vec.length !== EMBED_DIMENSIONS) throw new Error('embedding: bad shape');
  return vec;
}

async function matchChunks(vec: number[], k: number, minSim: number, signal?: AbortSignal): Promise<RetrievedChunk[]> {
  const base = (process.env.VITE_SUPABASE_URL as string).replace(/\/$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
  const res = await fetch(`${base}/rest/v1/rpc/match_rag_chunks`, {
    method: 'POST',
    // New-style secret keys (sb_secret_…) go in `apikey` only; legacy service_role JWTs also as Bearer.
    headers: { 'Content-Type': 'application/json', apikey: key, ...(key.startsWith('eyJ') ? { Authorization: `Bearer ${key}` } : {}) },
    body: JSON.stringify({ query_embedding: `[${vec.join(',')}]`, match_count: k, min_similarity: minSim }),
    signal,
  });
  if (!res.ok) throw new Error(`match_rag_chunks ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return (await res.json()) as RetrievedChunk[];
}

/** Retrieve k passages. Never throws: failures return an empty set plus an error string. */
export async function retrieve(query: string, k: number): Promise<RetrievalResult> {
  try {
    const rows = await withTimeout(async (signal) => {
      const vec = await embedQuery(query, signal);
      return matchChunks(vec, k, minSimilarity(), signal);
    }, RETRIEVAL_TIMEOUT_MS);
    return { passages: rows.map((r, i) => ({ ...r, label: `S${i + 1}` })) };
  } catch (e: unknown) {
    const err = e as { name?: string; message?: string };
    return { passages: [], error: err?.name === 'AbortError' ? 'retrieval timeout' : String(err?.message || e) };
  }
}

// ----------------------------------------------------------- prompt helpers

export function formatPassages(passages: Passage[]): string {
  return passages
    .map((p) => {
      const header = [p.title, p.section].filter(Boolean).join(' — ');
      const body = p.content.length > PASSAGE_MAX_CHARS ? p.content.slice(0, PASSAGE_MAX_CHARS) + '…' : p.content;
      return `[${p.label}] ${header}\n${body}`;
    })
    .join('\n\n');
}

export function groundingInstruction(language: 'es' | 'en', jsonTool: boolean): string {
  if (language === 'es') {
    return `FRAGMENTOS DE LIBROS DE TEXTO (corpus de MedEstudia; pueden contener errores de digitalización):
Usa estos fragmentos como fuente principal cuando sean pertinentes. Después de cada afirmación que se apoye en un fragmento, añade su marcador exacto entre corchetes, por ejemplo [S2]. Usa SOLO los marcadores listados; no inventes otros. Si un fragmento contradice tu conocimiento general, sigue el fragmento y sé prudente. Lo que no esté respaldado por los fragmentos puede incluirse sin marcador, pero nunca lo atribuyas a un fragmento. EXTENSIÓN: mantén la misma extensión que tendría tu respuesta sin fragmentos; resume y sintetiza, no copies ni enumeres el contenido de los fragmentos.${jsonTool ? ' Coloca los marcadores dentro de los textos del JSON, sin cambiar la estructura pedida.' : ''}`;
  }
  return `TEXTBOOK PASSAGES (MedEstudia corpus, in Spanish; may contain scanning errors):
Use these passages as the primary source when relevant. After each claim supported by a passage, add its exact marker in brackets, e.g. [S2]. Use ONLY the listed markers; never invent others. If a passage contradicts your general knowledge, follow the passage and be cautious. Content not supported by the passages may be included without a marker, but never attribute it to a passage. LENGTH: keep the same length your answer would have without passages; summarise and synthesise, do not copy or list the passages' content.${jsonTool ? ' Put the markers inside the JSON string values, without changing the requested structure.' : ''}`;
}

// ------------------------------------------------------- citation checking

/** Every label cited anywhere in the text (handles "[S1]" and "[S1, S3]"). */
export function citedLabels(text: string): Set<string> {
  const out = new Set<string>();
  for (const m of text.matchAll(/\[(S\d{1,2}(?:\s*,\s*S\d{1,2})*)\]/g)) {
    m[1].split(',').forEach((l) => out.add(l.trim()));
  }
  return out;
}

/** Remove markers whose labels were not retrieved; keep valid ones. */
export function stripInvalidMarkers(text: string, valid: Set<string>): string {
  return text.replace(/\s?\[(S\d{1,2}(?:\s*,\s*S\d{1,2})*)\]/g, (whole, inner: string) => {
    const keep = inner.split(',').map((l) => l.trim()).filter((l) => valid.has(l));
    if (keep.length === 0) return '';
    return whole.startsWith(' ') ? ` [${keep.join(', ')}]` : `[${keep.join(', ')}]`;
  });
}

/** Apply stripInvalidMarkers to every string inside a parsed JSON value. */
export function cleanMarkersDeep<T>(value: T, valid: Set<string>): T {
  if (typeof value === 'string') return stripInvalidMarkers(value, valid) as unknown as T;
  if (Array.isArray(value)) return value.map((v) => cleanMarkersDeep(v, valid)) as unknown as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = cleanMarkersDeep(v, valid);
    return out;
  }
  return value;
}

export function buildSourceRefs(passages: Passage[], cited: Set<string>): SourceRef[] {
  return passages.map((p) => ({
    label: p.label,
    title: p.title,
    section: p.section,
    chunkId: p.id,
    similarity: Math.round(p.similarity * 1000) / 1000,
    excerpt: p.content.slice(0, EXCERPT_CHARS).trim() + (p.content.length > EXCERPT_CHARS ? '…' : ''),
    cited: cited.has(p.label),
  }));
}
