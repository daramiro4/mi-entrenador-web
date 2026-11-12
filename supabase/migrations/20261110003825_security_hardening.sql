-- Endurecimiento de seguridad (auditoría 2026-11-10). No cambia datos ni políticas RLS.

-- 1) El rol anónimo no necesita ningún permiso sobre las tablas de la app: toda la app exige sesión.
--    RLS ya bloquea el acceso, pero así deja de ser la única barrera (y TRUNCATE no lo gobierna RLS).
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on sequences from anon;

-- 2) Los usuarios con sesión solo operan filas propias (select/insert/update/delete bajo RLS):
--    sin TRUNCATE, TRIGGER ni REFERENCES.
revoke truncate, trigger, references on all tables in schema public from authenticated;

-- 3) handle_new_user() es un trigger de auth.users: no debe poder llamarse por /rest/v1/rpc.
alter function public.handle_new_user() set search_path = public;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
