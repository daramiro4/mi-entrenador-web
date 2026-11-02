-- REGISTRO del historial remoto (reconstruido de supabase_migrations.schema_migrations).
-- Ya está aplicado en producción: NO se aplica de nuevo. Existe solo para que el
-- historial local coincida con el remoto.

create table public.fatigue_index (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  date date not null,
  acute_load numeric,
  chronic_load numeric,
  acwr_ratio numeric,
  recommendation text check (recommendation in ('normal', 'precaucion', 'descanso')),
  notes text,
  created_at timestamptz not null default now()
);
create unique index idx_fatigue_index_user_date on public.fatigue_index(user_id, date);
