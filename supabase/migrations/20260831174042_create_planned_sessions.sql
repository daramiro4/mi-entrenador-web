-- planned_sessions: instancias día a día del plan de entrenamiento generado por el motor.
-- No confundir con `workouts`, que es la biblioteca de plantillas reutilizables.

create table public.planned_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  season_id bigint not null references public.seasons(id),
  date date not null,
  workout_template_id uuid references public.workouts(id) on delete set null,
  session_type text not null check (session_type = any (array['quality', 'z2', 'strength', 'rest'])),
  planned_tss numeric,
  status text not null default 'planned' check (status = any (array['planned', 'done', 'skipped', 'postponed', 'degraded'])),
  actual_activity_id bigint references public.activities(id) on delete set null,
  notes jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index planned_sessions_user_id_date_idx on public.planned_sessions (user_id, date);
create index planned_sessions_season_id_idx on public.planned_sessions (season_id);

alter table public.planned_sessions enable row level security;

create policy own_data_planned_sessions on public.planned_sessions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
