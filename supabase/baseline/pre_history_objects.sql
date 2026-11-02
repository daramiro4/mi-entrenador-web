-- REGISTRO, NO MIGRACIÓN. NUNCA SE APLICA. Vive fuera de supabase/migrations/ a propósito:
-- si estuviera dentro, `supabase db push` lo trataría como migración pendiente.
--
-- Objetos de producción creados ANTES de la primera migración del historial remoto
-- (20260829142009), vía panel de Supabase / plantilla inicial, por lo que ninguna
-- migración los crea. Reconstruido el 2026-11-02 solo con lecturas del catálogo
-- (information_schema, pg_policies, pg_get_functiondef) de exqohgqxcnzevaneqnmc.
-- Las migraciones posteriores añaden a profiles: telegram_chat_id y api_key.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  weight_kg numeric default 70,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  type text,
  ftp_ref integer,
  notes text,
  intervals jsonb,
  created_at timestamptz default now()
);
alter table public.workouts enable row level security;
create policy "Users can view own workouts" on public.workouts
  for select using (auth.uid() = user_id);
create policy "Users can insert own workouts" on public.workouts
  for insert with check (auth.uid() = user_id);
create policy "Users can delete own workouts" on public.workouts
  for delete using (auth.uid() = user_id);
-- (la política de update se añade en 20260901182254_workouts_update_policy)

create or replace function public.handle_new_user()
  returns trigger
  language plpgsql
  security definer
as $function$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$function$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
