-- MedEstudia — índice de recuperación (RAG) sobre el corpus de libros de texto
-- Ejecutar en Supabase: SQL Editor → New query → pegar y Run (una sola vez).
--
-- MODELO DE ACCESO
--   rag_chunks contiene texto de libros cuya licencia de redistribución no está
--   verificada (ver docs/project-briefing-2026-10-15.md §4.6). Por eso:
--     · RLS activado y SIN políticas → la anon key del navegador no puede leer nada.
--     · La búsqueda solo se hace desde /api/ai con la service_role key (servidor).
--     · match_rag_chunks solo es ejecutable por service_role.
--
-- EMBEDDINGS
--   Azure OpenAI text-embedding-3-small con dimensions = 512 (reducción nativa
--   del modelo, no truncado manual). Similitud coseno. Si cambias de modelo o de
--   dimensión, hay que regenerar TODO el índice: no se mezclan espacios vectoriales.

begin;

-- pgvector: Supabase lo instala en `extensions` o en `public` según el proyecto.
-- Los tipos se usan sin calificar y search_path incluye ambos esquemas.
create extension if not exists vector;
set local search_path = public, extensions;

create table if not exists public.rag_chunks (
  id            text primary key,          -- id estable del chunk (rag/output/chunks.json)
  source        text not null,             -- archivo PDF de origen
  title         text not null,             -- título legible del libro
  subject       text,
  area          text,
  rotation      text,
  section       text,
  chunk_index   integer not null,
  content       text not null,
  content_hash  text not null,             -- sha256 del contenido embebido (reproducibilidad)
  embedding     vector(512) not null,
  embed_model   text not null,             -- p. ej. "text-embedding-3-small@512"
  created_at    timestamptz not null default now()
);

alter table public.rag_chunks enable row level security;
-- Sin políticas: anon y authenticated no tienen acceso. service_role ignora RLS.
revoke all on public.rag_chunks from anon, authenticated;

-- Índice HNSW para búsqueda aproximada por coseno.
create index if not exists rag_chunks_embedding_hnsw
  on public.rag_chunks
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- Búsqueda: devuelve los k chunks más similares por encima de un umbral.
create or replace function public.match_rag_chunks(
  query_embedding vector(512),
  match_count     integer default 6,
  min_similarity  double precision default 0.0
)
returns table (
  id          text,
  title       text,
  subject     text,
  section     text,
  chunk_index integer,
  content     text,
  similarity  double precision
)
language sql
stable
set search_path = public, extensions
as $$
  select c.id, c.title, c.subject, c.section, c.chunk_index, c.content,
         1 - (c.embedding <=> query_embedding) as similarity
  from public.rag_chunks c
  where 1 - (c.embedding <=> query_embedding) >= min_similarity
  order by c.embedding <=> query_embedding
  limit least(greatest(match_count, 1), 20);
$$;

revoke all on function public.match_rag_chunks(vector, integer, double precision) from public, anon, authenticated;
grant execute on function public.match_rag_chunks(vector, integer, double precision) to service_role;

commit;
