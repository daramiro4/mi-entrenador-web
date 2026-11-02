-- REGISTRO del historial remoto (reconstruido de supabase_migrations.schema_migrations).
-- Ya está aplicado en producción: NO se aplica de nuevo. Existe solo para que el
-- historial local coincida con el remoto.

create table if not exists ftp_history (
  id bigint generated always as identity primary key,
  date date not null,
  ftp_watts numeric not null,
  method text check (method in ('ramp_test', '20min_test', 'estimated', 'manual')),
  source text default 'mywhoosh',
  notes text,
  created_at timestamptz not null default now()
);
