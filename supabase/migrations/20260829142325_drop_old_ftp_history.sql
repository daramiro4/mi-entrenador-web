-- REGISTRO del historial remoto (reconstruido de supabase_migrations.schema_migrations).
-- Ya está aplicado en producción: NO se aplica de nuevo. Existe solo para que el
-- historial local coincida con el remoto.
drop table if exists public.ftp_history cascade;
