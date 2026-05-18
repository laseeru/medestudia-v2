-- Convención Científica 2026 — registro de participantes desde el panel admin
-- Ejecutar en Supabase: SQL Editor → New query → pegar y Run

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  commission_slug text not null,
  institution text,
  registered_at timestamptz not null default now()
);

create index if not exists registrations_commission_slug_idx on public.registrations (commission_slug);
create index if not exists registrations_name_idx on public.registrations (full_name);

-- RLS: solo lectura/escritura desde el panel admin (con anon key por ahora)
alter table public.registrations enable row level security;

drop policy if exists "registrations_select_anon" on public.registrations;
drop policy if exists "registrations_insert_anon" on public.registrations;
drop policy if exists "registrations_delete_anon" on public.registrations;

create policy "registrations_select_anon" on public.registrations for select using (true);
create policy "registrations_insert_anon" on public.registrations for insert with check (true);
create policy "registrations_delete_anon" on public.registrations for delete using (true);
