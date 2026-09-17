-- Convención Científica — endurecimiento de RLS
-- Ejecutar en Supabase: SQL Editor → New query → pegar y Run
--
-- CONTEXTO
-- Las políticas originales eran `using (true)` para select/insert/update/delete
-- en todas las tablas. La anon key viaja en el bundle del navegador (así debe
-- ser), de modo que cualquier visitante podía leer la lista completa de
-- inscripciones —nombres y correos reales— y borrar filas de cualquier tabla.
--
-- MODELO NUEVO
--   summaries / comments  → lectura pública (se muestran en el sitio),
--                           escritura cerrada mientras el evento está inactivo.
--   registrations         → sin acceso anónimo (contiene correos).
--   name_merges           → sin acceso anónimo (dato interno de administración).
--
-- El panel de administración deja de usar la anon key y pasa por /api/admin,
-- que usa la service_role key en el servidor. service_role ignora RLS, así que
-- no necesita políticas propias.
--
-- Para reabrir el evento (2027), ver reopen_convention.sql.

begin;

-- ---------------------------------------------------------------- summaries
alter table public.summaries enable row level security;

drop policy if exists "summaries_select_anon" on public.summaries;
drop policy if exists "summaries_insert_anon" on public.summaries;
drop policy if exists "summaries_update_anon" on public.summaries;
drop policy if exists "summaries_delete_anon" on public.summaries;

-- Los resúmenes son contenido público del evento: se siguen mostrando.
create policy "summaries_select_public" on public.summaries
  for select using (true);
-- Sin políticas de escritura: la recepción de resúmenes está cerrada.

-- ----------------------------------------------------------------- comments
alter table public.comments enable row level security;

drop policy if exists "comments_select_anon" on public.comments;
drop policy if exists "comments_insert_anon" on public.comments;
drop policy if exists "comments_update_anon" on public.comments;
drop policy if exists "comments_delete_anon" on public.comments;

create policy "comments_select_public" on public.comments
  for select using (true);
-- Sin políticas de escritura: los comentarios están cerrados.

-- ------------------------------------------------------------ registrations
-- Contiene nombres y correos de personas reales. Nada de acceso anónimo:
-- el panel admin lee esta tabla a través de /api/admin (service_role).
alter table public.registrations enable row level security;

drop policy if exists "registrations_select_anon" on public.registrations;
drop policy if exists "registrations_insert_anon" on public.registrations;
drop policy if exists "registrations_update_anon" on public.registrations;
drop policy if exists "registrations_delete_anon" on public.registrations;

-- --------------------------------------------------------------- name_merges
-- Dato interno de reconciliación de nombres; solo el panel admin lo necesita.
alter table public.name_merges enable row level security;

drop policy if exists "name_merges_select_anon" on public.name_merges;
drop policy if exists "name_merges_insert_anon" on public.name_merges;
drop policy if exists "name_merges_update_anon" on public.name_merges;
drop policy if exists "name_merges_delete_anon" on public.name_merges;

commit;

-- Verificación: debe listar solo summaries_select_public y comments_select_public.
-- select tablename, policyname, cmd from pg_policies
--   where schemaname = 'public' order by tablename, policyname;
