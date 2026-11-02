-- REGISTRO del historial remoto (reconstruido de supabase_migrations.schema_migrations).
-- Ya está aplicado en producción: NO se aplica de nuevo. Existe solo para que el
-- historial local coincida con el remoto.

create table if not exists daily_metrics (
  id bigint generated always as identity primary key,
  date date not null unique,
  sleep_score int,
  sleep_duration_minutes int,
  stress_avg int,
  hrv_ms numeric,
  resting_hr int,
  body_battery_max int,
  body_battery_min int,
  weight_kg numeric,
  body_fat_pct numeric,
  source text default 'garmin',
  created_at timestamptz not null default now()
);
