#!/usr/bin/env node
/**
 * Embeds rag/output/chunks.json with Azure OpenAI and uploads it to Supabase
 * (table public.rag_chunks — create it first with supabase/rag_schema.sql).
 *
 *   node rag/embed.mjs --dry-run        # filter + count only, no API calls
 *   node rag/embed.mjs --limit 200      # small test run
 *   node rag/embed.mjs                  # full run (resumable: skips ids already uploaded)
 *
 * Required in .env.local (server-side only; never prefix with VITE_):
 *   AZURE_OPENAI_EMBED_ENDPOINT   resource URL (https://<resource>.services.ai.azure.com) or the full
 *                                 …/openai/deployments/<name>/embeddings?api-version=… URL
 *   AZURE_OPENAI_EMBED_DEPLOYMENT deployment name if the endpoint is a base URL (default text-embedding-3-small)
 *   AZURE_OPENAI_EMBED_KEY        key for that resource (falls back to AZURE_FOUNDRY_API_KEY)
 *   VITE_SUPABASE_URL             existing project URL
 *   SUPABASE_SERVICE_ROLE_KEY     service_role key (already used by /api/admin)
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { resolveEmbedEndpoint } from '../api/_lib/embedEndpoint.js';

const ROOT = process.cwd();
const DIMENSIONS = 512;
const EMBED_MODEL_TAG = `text-embedding-3-small@${DIMENSIONS}`;
const BATCH = 96;          // inputs per embeddings request
const UPSERT_BATCH = 96;
const MAX_RETRIES = 8;

// ------------------------------------------------------------------ env
function loadEnvLocal() {
  const file = join(ROOT, '.env.local');
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf-8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 1) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    if (!(k in process.env)) process.env[k] = v;
  }
}
loadEnvLocal();

const args = process.argv.slice(2);
const DRY = args.includes('--dry-run');
const limitIdx = args.indexOf('--limit');
const LIMIT = limitIdx >= 0 ? Number(args[limitIdx + 1]) : Infinity;

// --------------------------------------------------------- quality filter
// High-confidence corruption only — same signals as initial-codebase-audit.md
// §5.3 (221 chunks): NUL bytes, and Latin-1 letters that never occur in
// Spanish (Û, Ì, È, …; Spanish uses only acute accents, ñ and ü). Ordinary OCR
// typos are NOT filtered — they cannot be detected reliably and are a
// documented limitation of the corpus.
const MOJIBAKE = /[ÀÂÃÈÊÌÎÒÔÕÙÛàâãèêìîòôõùû]/;
export function isCorrupt(text) {
  return text.includes('\u0000') || MOJIBAKE.test(text);
}

export function embeddingText(chunk) {
  const m = chunk.metadata ?? {};
  const header = [m.title, m.section].filter(Boolean).join(' — ');
  return `${header}\n${chunk.content}`.trim();
}

const sha256 = (s) => createHash('sha256').update(s).digest('hex');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ------------------------------------------------------------ embeddings
async function embedBatch(texts) {
  const endpoint = resolveEmbedEndpoint(process.env);
  const key = process.env.AZURE_OPENAI_EMBED_KEY || process.env.AZURE_FOUNDRY_API_KEY;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    let res;
    try {
      res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': key },
        body: JSON.stringify({ input: texts, dimensions: DIMENSIONS }),
      });
    } catch (e) {
      // Dropped connections ("terminated", ECONNRESET) are transient: back off and retry.
      const wait = Math.min(60_000, 2 ** attempt * 1000);
      console.warn(`  network error (${e.message}) — retrying in ${Math.round(wait / 1000)}s (attempt ${attempt})`);
      await sleep(wait);
      continue;
    }
    if (res.ok) {
      const json = await res.json();
      return json.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
    }
    if (res.status === 429 || res.status >= 500) {
      const wait = Number(res.headers.get('retry-after')) * 1000 || Math.min(60_000, 2 ** attempt * 1000);
      console.warn(`  ${res.status} — retrying in ${Math.round(wait / 1000)}s (attempt ${attempt})`);
      await sleep(wait);
      continue;
    }
    throw new Error(`Embeddings request failed: ${res.status} ${(await res.text()).slice(0, 300)}`);
  }
  throw new Error('Embeddings request failed after retries');
}

async function existingIds(supabase) {
  const ids = new Set();
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase.from('rag_chunks').select('id').range(from, from + PAGE - 1);
    if (error) throw new Error(`Supabase read failed: ${error.message}`);
    data.forEach((r) => ids.add(r.id));
    if (data.length < PAGE) break;
  }
  return ids;
}

// ------------------------------------------------------------------ main
async function main() {
  const chunksPath = join(ROOT, 'rag/output/chunks.json');
  const raw = readFileSync(chunksPath, 'utf-8');
  const chunks = JSON.parse(raw);

  const kept = [];
  const skipped = { corrupt: 0, empty: 0 };
  for (const c of chunks) {
    if (!c.content?.trim()) { skipped.empty++; continue; }
    if (isCorrupt(c.content)) { skipped.corrupt++; continue; }
    kept.push(c);
  }
  console.log(`chunks.json: ${chunks.length} chunks · kept ${kept.length} · skipped corrupt ${skipped.corrupt}, empty ${skipped.empty}`);

  const manifest = {
    createdAt: new Date().toISOString(),
    embedModel: EMBED_MODEL_TAG,
    corpusSha256: sha256(raw),
    totalChunks: chunks.length,
    keptChunks: kept.length,
    skipped,
  };

  if (args.includes('--probe')) {
    const [v] = await embedBatch(['Hipertensión arterial: tratamiento inicial']);
    console.log(`Probe OK: ${resolveEmbedEndpoint(process.env).replace(/^https:\/\/[^/]+/, '<resource>')} → ${v.length} dims`);
    return;
  }
  if (DRY) {
    console.log('Dry run — no API calls made.');
    console.log(JSON.stringify(manifest, null, 2));
    return;
  }

  for (const k of ['AZURE_OPENAI_EMBED_ENDPOINT', 'VITE_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']) {
    if (!process.env[k]) throw new Error(`Missing ${k} in .env.local`);
  }
  if (!process.env.AZURE_OPENAI_EMBED_KEY && !process.env.AZURE_FOUNDRY_API_KEY) {
    throw new Error('Missing AZURE_OPENAI_EMBED_KEY (or AZURE_FOUNDRY_API_KEY) in .env.local');
  }

  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const done = await existingIds(supabase);
  const todo = kept.filter((c) => !done.has(c.id)).slice(0, LIMIT);
  console.log(`Already uploaded: ${done.size} · to embed now: ${todo.length}`);

  let uploaded = 0;
  const started = Date.now();
  for (let i = 0; i < todo.length; i += BATCH) {
    const batch = todo.slice(i, i + BATCH);
    const texts = batch.map(embeddingText);
    const vectors = await embedBatch(texts);

    const rows = batch.map((c, j) => ({
      id: c.id,
      source: c.metadata.source,
      title: c.metadata.title,
      subject: c.metadata.subject ?? null,
      area: c.metadata.area ?? null,
      rotation: c.metadata.rotation ?? null,
      section: c.metadata.section ?? null,
      chunk_index: c.metadata.chunkIndex ?? 0,
      content: c.content,
      content_hash: sha256(texts[j]),
      embedding: vectors[j],
      embed_model: EMBED_MODEL_TAG,
    }));

    for (let u = 0; u < rows.length; u += UPSERT_BATCH) {
      const { error } = await supabase.from('rag_chunks').upsert(rows.slice(u, u + UPSERT_BATCH));
      if (error) throw new Error(`Supabase upsert failed: ${error.message}`);
    }
    uploaded += rows.length;
    const rate = uploaded / ((Date.now() - started) / 1000);
    const eta = Math.round((todo.length - uploaded) / rate / 60);
    process.stdout.write(`\r  ${uploaded}/${todo.length} uploaded · ~${eta} min left   `);
  }
  console.log('\nDone.');

  manifest.uploadedThisRun = uploaded;
  manifest.totalInIndex = done.size + uploaded;
  writeFileSync(join(ROOT, 'rag/output/embed-manifest.json'), JSON.stringify(manifest, null, 2));
  console.log('Wrote rag/output/embed-manifest.json');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
