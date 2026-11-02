-- Tablas de usuario del módulo de fuerza + columnas nullable en strength_sessions
-- + caché privada de tokens de Garmin. Solo cambios ADITIVOS.
-- Rollback (manual):
--   alter table public.strength_sessions drop column workout_id, drop column exercise_slug,
--     drop column set_index, drop column rpe;
--   drop table public.garmin_tokens; drop table public.user_strength_prefs;
--   drop table public.strength_workouts;

create table public.strength_workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  planned_session_id uuid references public.planned_sessions(id) on delete set null,
  name text not null,
  format text not null,
  date date not null default current_date,
  duration_min integer not null,
  intensity text,
  blocks jsonb not null default '[]'::jsonb,
  status text not null default 'generated'
    check (status = any (array['generated','in_progress','done','skipped'])),
  rpe numeric,
  felt text check (felt is null or felt = any (array['easy','ok','hard'])),
  discomfort_areas text[] not null default '{}',
  strength_tss numeric,
  garmin_workout_id text,
  progress jsonb,
  generation_log jsonb,
  created_at timestamptz not null default now()
);
create index strength_workouts_user_date_idx on public.strength_workouts (user_id, date desc);
alter table public.strength_workouts enable row level security;
create policy own_data_strength_workouts on public.strength_workouts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.user_strength_prefs (
  user_id uuid primary key references public.profiles(id),
  days_per_week smallint not null default 2 check (days_per_week between 1 and 5),
  session_minutes smallint not null default 30 check (session_minutes between 15 and 60),
  equipment text[] not null default '{bodyweight}',
  level smallint not null default 1 check (level between 1 and 3),
  limitations text[] not null default '{}',
  excluded_areas text[] not null default '{}',
  updated_at timestamptz not null default now()
);
alter table public.user_strength_prefs enable row level security;
create policy own_data_user_strength_prefs on public.user_strength_prefs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.strength_sessions
  add column workout_id uuid references public.strength_workouts(id) on delete set null,
  add column exercise_slug text,
  add column set_index smallint,
  add column rpe numeric;

-- Caché privada de sesión/tokens de Garmin: RLS activado SIN políticas de cliente
-- (solo accesible con service_role desde el servidor).
create table public.garmin_tokens (
  user_id uuid primary key references public.profiles(id),
  tokens text not null,
  updated_at timestamptz not null default now()
);
alter table public.garmin_tokens enable row level security;
