-- REGISTRO del historial remoto (reconstruido de supabase_migrations.schema_migrations).
-- Ya está aplicado en producción: NO se aplica de nuevo. Existe solo para que el
-- historial local coincida con el remoto.

create table if not exists activities (
  id bigint generated always as identity primary key,
  date date not null,
  activity_type text not null check (activity_type in ('cycling', 'strength', 'running', 'other')),
  duration_minutes numeric,
  avg_power numeric,
  normalized_power numeric,
  tss numeric,
  training_load numeric,
  raw_data jsonb,
  source text default 'garmin',
  created_at timestamptz not null default now()
);

create index if not exists idx_activities_date on activities(date);
