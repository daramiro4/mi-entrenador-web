-- Biblioteca compartida de fuerza (solo lectura para usuarios autenticados).
-- Solo cambios ADITIVOS. Rollback (manual, no ejecutar en producción sin revisar):
--   drop table public.workout_formats; drop table public.exercises;

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_es text not null,
  pattern text not null check (pattern = any (array['hinge','squat','push','pull','core','carry','mobility'])),
  equipment text[] not null default '{}',
  level smallint not null default 1 check (level between 1 and 3),
  leg_load text not null default 'none' check (leg_load = any (array['none','light','heavy'])),
  contraindications text[] not null default '{}',
  alternatives text[] not null default '{}',
  cues_es text[] not null default '{}',
  common_error_es text,
  garmin_category text,
  garmin_exercise text,
  pose_a jsonb,
  pose_b jsonb,
  unilateral boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.workout_formats (
  slug text primary key,
  name_es text not null,
  rules jsonb not null default '{}'::jsonb
);

alter table public.exercises enable row level security;
alter table public.workout_formats enable row level security;

create policy exercises_read_authenticated on public.exercises
  for select to authenticated using (true);
create policy workout_formats_read_authenticated on public.workout_formats
  for select to authenticated using (true);
