-- REGISTRO del historial remoto (reconstruido de supabase_migrations.schema_migrations).
-- Ya está aplicado en producción: NO se aplica de nuevo. Existe solo para que el
-- historial local coincida con el remoto.

alter table public.profiles add column telegram_chat_id text unique;
alter table public.profiles add column api_key uuid not null default gen_random_uuid() unique;
