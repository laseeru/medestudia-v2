-- Convención Científica — reabrir recepción de resúmenes y comentarios
-- Ejecutar SOLO al activar una nueva edición del evento, junto con
-- CONVENTION_ACTIVE = true en src/lib/convencionConfig.ts
--
-- Vuelve a permitir que los participantes envíen resúmenes y comentarios con la
-- anon key. Sigue SIN abrir registrations ni name_merges: esas dos tablas se
-- administran únicamente vía /api/admin con la service_role key.

begin;

-- Alta de resúmenes por parte de los participantes.
drop policy if exists "summaries_insert_public" on public.summaries;
create policy "summaries_insert_public" on public.summaries
  for insert with check (true);

-- Alta de comentarios por parte de los participantes.
drop policy if exists "comments_insert_public" on public.comments;
create policy "comments_insert_public" on public.comments
  for insert with check (true);

commit;

-- NOTA sobre edición: el sitio permite editar el propio resumen durante una
-- ventana de tiempo, pero la anon key no puede probar identidad, así que una
-- política `for update using (true)` dejaría que cualquiera reescriba cualquier
-- resumen. Si se necesita edición en 2027, hacerla pasar por un endpoint del
-- servidor con un token de propiedad, no por la anon key.

-- Para volver a cerrar el evento, ejecutar de nuevo security_hardening.sql.
