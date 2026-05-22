create table if not exists public.name_merges (
  alias text primary key,
  canonical text not null,
  created_at timestamptz not null default now()
);

create index if not exists name_merges_canonical_idx on public.name_merges (canonical);
create index if not exists name_merges_alias_idx on public.name_merges (alias);

alter table public.name_merges enable row level security;

drop policy if exists "name_merges_select_anon" on public.name_merges;
drop policy if exists "name_merges_insert_anon" on public.name_merges;
drop policy if exists "name_merges_update_anon" on public.name_merges;
drop policy if exists "name_merges_delete_anon" on public.name_merges;

create policy "name_merges_select_anon" on public.name_merges for select using (true);
create policy "name_merges_insert_anon" on public.name_merges for insert with check (true);
create policy "name_merges_update_anon" on public.name_merges for update using (true);
create policy "name_merges_delete_anon" on public.name_merges for delete using (true);
