-- REGISTRO del historial remoto (reconstruido de supabase_migrations.schema_migrations).
-- Ya está aplicado en producción: NO se aplica de nuevo. Existe solo para que el
-- historial local coincida con el remoto.

alter table public.seasons add column focus_areas text[]
  check (focus_areas <@ array['vo2max', 'general_health', 'climbing', 'rouleur', 'weight_loss']);
alter table public.seasons add column target_weight_kg numeric;
