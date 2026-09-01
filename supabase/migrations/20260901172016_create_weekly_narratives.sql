-- weekly_narratives: resumen textual generado con Gemini al cerrar cada
-- semana (decisión 7). Complementario a la lógica determinista del plan,
-- nunca la sustituye.

create table public.weekly_narratives (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id),
  season_id bigint not null references public.seasons(id),
  week_start_date date not null,
  narrative text not null,
  created_at timestamp with time zone not null default now(),
  unique (user_id, week_start_date)
);

create index weekly_narratives_user_id_week_start_date_idx
  on public.weekly_narratives (user_id, week_start_date);

alter table public.weekly_narratives enable row level security;

create policy own_data_weekly_narratives on public.weekly_narratives
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
