-- Comprobaciones de RLS (ejecutar en una BD de PRUEBA con las migraciones aplicadas).
-- Esperado: cada bloque imprime el valor indicado en el comentario.
begin;
insert into public.profiles(id, name) values ('00000000-0000-0000-0000-00000000000a','A'),('00000000-0000-0000-0000-00000000000b','B') on conflict do nothing;
insert into public.strength_workouts(user_id,name,format,duration_min) values ('00000000-0000-0000-0000-00000000000a','de A','circuito',30);
insert into public.garmin_tokens(user_id,tokens) values ('00000000-0000-0000-0000-00000000000a','x') on conflict do nothing;

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}',true), set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000b',true);
select 'B ve workouts de A (esperado 0)' as check, count(*) from public.strength_workouts;
select 'B lee biblioteca (esperado >0)' as check, count(*) > 0 from public.exercises;
select 'B lee garmin_tokens (esperado 0)' as check, count(*) from public.garmin_tokens;

select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}',true), set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000a',true);
select 'A ve su workout (esperado 1)' as check, count(*) from public.strength_workouts;
select 'A lee garmin_tokens (esperado 0, sin politicas)' as check, count(*) from public.garmin_tokens;

reset role;
set local role anon;
select 'anon lee biblioteca (esperado 0)' as check, count(*) from public.exercises;
rollback;
