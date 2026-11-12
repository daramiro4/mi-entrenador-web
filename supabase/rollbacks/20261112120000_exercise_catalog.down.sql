-- VUELTA de supabase/migrations/20261112120000_exercise_catalog.sql. GENERADO (npm run gen:exercise-catalog).
-- NO está en supabase/migrations a propósito: se ejecuta a mano (psql / SQL editor) solo si hay que deshacer el corte.
--
-- Hace: elimina exercises (la NUEVA), exercise_animations y exercise_categories, y devuelve exercises_legacy a su nombre original
-- con su clave primaria, su unique de slug y su política de lectura. Las 41 filas y las poses de la tabla antigua no se tocan.
-- ADVERTENCIA: se pierde todo lo que se haya escrito en las tablas nuevas (ediciones de fichas, animaciones, revisiones).
--           Haz antes un pg_dump de exercises / exercise_animations si hay trabajo que conservar.
-- Se detiene sin cambios si el estado no es el esperado (las comprobaciones van dentro de la misma transacción).

begin;

do $$
begin
  if to_regclass('public.exercises_legacy') is null then
    raise exception 'No existe public.exercises_legacy: la migración no está aplicada (o ya se deshizo).';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'exercises' and column_name = 'garmin_category') then
    raise exception 'public.exercises no es la tabla nueva (no tiene garmin_category): no se hace nada.';
  end if;
end $$;

drop table public.exercises;
drop table public.exercise_animations;
drop table public.exercise_categories;

alter table public.exercises_legacy rename to exercises;
alter index public.exercises_legacy_pkey rename to exercises_pkey;
alter index public.exercises_legacy_slug_key rename to exercises_slug_key;
alter policy exercises_legacy_read_authenticated on public.exercises rename to exercises_read_authenticated;

commit;
