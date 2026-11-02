-- REGISTRO del historial remoto (reconstruido de supabase_migrations.schema_migrations).
-- Ya está aplicado en producción: NO se aplica de nuevo. Existe solo para que el
-- historial local coincida con el remoto.

create table if not exists strength_sessions (
  id bigint generated always as identity primary key,
  activity_id bigint references activities(id) on delete cascade,
  date date not null,
  exercise text not null,
  sets int,
  reps int,
  weight_kg numeric,
  volume_kg numeric generated always as (sets * reps * weight_kg) stored,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_strength_sessions_date on strength_sessions(date);
