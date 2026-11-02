-- REGISTRO del historial remoto (reconstruido de supabase_migrations.schema_migrations).
-- Ya está aplicado en producción: NO se aplica de nuevo. Existe solo para que el
-- historial local coincida con el remoto.

alter table public.daily_metrics enable row level security;
alter table public.activities enable row level security;
alter table public.strength_sessions enable row level security;
alter table public.ftp_history enable row level security;
alter table public.fatigue_index enable row level security;

create policy "own_data_daily_metrics" on public.daily_metrics
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own_data_activities" on public.activities
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own_data_strength_sessions" on public.strength_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own_data_ftp_history" on public.ftp_history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own_data_fatigue_index" on public.fatigue_index
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
