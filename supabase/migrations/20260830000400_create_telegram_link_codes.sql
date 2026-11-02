-- REGISTRO del historial remoto (reconstruido de supabase_migrations.schema_migrations).
-- Ya está aplicado en producción: NO se aplica de nuevo. Existe solo para que el
-- historial local coincida con el remoto.

create table public.telegram_link_codes (
  code text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  expires_at timestamptz not null,
  used boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_telegram_link_codes_user on public.telegram_link_codes(user_id);

alter table public.telegram_link_codes enable row level security;

create policy "own_data_telegram_link_codes" on public.telegram_link_codes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
