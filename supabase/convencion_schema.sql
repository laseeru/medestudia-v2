-- Convención Científica 2026 — tablas mínimas para resúmenes y comentarios
-- Ejecutar en Supabase: SQL Editor → New query → pegar y Run

create table if not exists public.summaries (
  id uuid primary key default gen_random_uuid(),
  commission_slug text not null,
  title text not null,
  authors text not null,
  institution text not null,
  summary text not null,
  created_at timestamptz not null default now()
);

create index if not exists summaries_commission_slug_idx on public.summaries (commission_slug);
create index if not exists summaries_created_at_idx on public.summaries (created_at desc);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  summary_id uuid not null references public.summaries (id) on delete cascade,
  commenter_name text not null,
  comment text not null,
  created_at timestamptz not null default now()
);

create index if not exists comments_summary_id_idx on public.comments (summary_id);
create index if not exists comments_created_at_idx on public.comments (created_at);

-- RLS: participación abierta con clave anónima (ajustar si restringe IP / captcha más adelante)
alter table public.summaries enable row level security;
alter table public.comments enable row level security;

drop policy if exists "summaries_select_anon" on public.summaries;
drop policy if exists "summaries_insert_anon" on public.summaries;
create policy "summaries_select_anon" on public.summaries for select using (true);
create policy "summaries_insert_anon" on public.summaries for insert with check (true);

drop policy if exists "comments_select_anon" on public.comments;
drop policy if exists "comments_insert_anon" on public.comments;
create policy "comments_select_anon" on public.comments for select using (true);
create policy "comments_insert_anon" on public.comments for insert with check (true);
