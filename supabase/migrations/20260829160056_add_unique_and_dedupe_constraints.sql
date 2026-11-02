-- REGISTRO del historial remoto (reconstruido de supabase_migrations.schema_migrations).
-- Ya está aplicado en producción: NO se aplica de nuevo. Existe solo para que el
-- historial local coincida con el remoto.
ALTER TABLE public.daily_metrics
  ADD CONSTRAINT daily_metrics_user_date_key UNIQUE (user_id, date);

ALTER TABLE public.fatigue_index
  ADD CONSTRAINT fatigue_index_user_date_key UNIQUE (user_id, date);

ALTER TABLE public.activities
  ADD COLUMN external_id text;

ALTER TABLE public.activities
  ADD CONSTRAINT activities_user_external_id_key UNIQUE (user_id, external_id);
