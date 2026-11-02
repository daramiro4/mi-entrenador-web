-- REGISTRO del historial remoto (reconstruido de supabase_migrations.schema_migrations).
-- Ya está aplicado en producción: NO se aplica de nuevo. Existe solo para que el
-- historial local coincida con el remoto.

create table public.seasons (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  goal_type text not null check (goal_type in ('ftp_improvement', 'event_prep', 'maintenance')),
  target_date date,
  target_ftp numeric,
  hours_per_week numeric,
  strength_days_per_week int,
  status text not null default 'active' check (status in ('active', 'completed', 'archived')),
  started_at date not null default current_date,
  notes jsonb,
  created_at timestamptz not null default now()
);

-- Solo una temporada activa por usuario
create unique index idx_seasons_one_active_per_user
  on public.seasons(user_id)
  where status = 'active';

create index idx_seasons_user on public.seasons(user_id);

alter table public.seasons enable row level security;

create policy "own_data_seasons" on public.seasons
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
