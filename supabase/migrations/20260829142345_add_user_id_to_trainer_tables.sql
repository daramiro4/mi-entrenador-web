-- REGISTRO del historial remoto (reconstruido de supabase_migrations.schema_migrations).
-- Ya está aplicado en producción: NO se aplica de nuevo. Existe solo para que el
-- historial local coincida con el remoto.

alter table public.daily_metrics add column user_id uuid references public.profiles(id) on delete cascade;
alter table public.activities add column user_id uuid references public.profiles(id) on delete cascade;
alter table public.strength_sessions add column user_id uuid references public.profiles(id) on delete cascade;

-- Recreamos el unique de daily_metrics para que sea por usuario+fecha, no solo fecha
alter table public.daily_metrics drop constraint if exists daily_metrics_date_key;
create unique index idx_daily_metrics_user_date on public.daily_metrics(user_id, date);
