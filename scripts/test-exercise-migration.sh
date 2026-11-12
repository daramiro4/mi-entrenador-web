#!/usr/bin/env bash
# Prueba LOCAL e IDA Y VUELTA de la migración del catálogo de ejercicios en un Postgres desechable (Docker, sin publicar puertos).
#   bash scripts/test-exercise-migration.sh
# Pasos: estado actual de producción (migraciones de fuerza) → migración nueva → comprobaciones → vuelta → comprobaciones de que
# la tabla antigua quedó idéntica → ida otra vez. No toca ninguna base de datos real.
set -euo pipefail
cd "$(dirname "$0")/.."

NAME="exmig-test-$$"
IMAGE="postgres:17-alpine"
UP="supabase/migrations/20261112120000_exercise_catalog.sql"
DOWN="supabase/rollbacks/20261112120000_exercise_catalog.down.sql"
OLD_1="supabase/migrations/20261102202722_strength_library.sql"
OLD_2="supabase/migrations/20261102202859_seed_strength_library.sql"

cleanup() { docker rm -f "$NAME" >/dev/null 2>&1 || true; }
trap cleanup EXIT

docker run -d --rm --name "$NAME" -e POSTGRES_PASSWORD=test "$IMAGE" >/dev/null
# El entrypoint de postgres arranca, inicializa y REINICIA el servidor: esperar a varias consultas reales seguidas (no solo a pg_isready).
OKS=0
for _ in $(seq 1 90); do
  if docker exec "$NAME" psql -U postgres -tAc "select 1" >/dev/null 2>&1; then OKS=$((OKS + 1)); else OKS=0; fi
  [ "$OKS" -ge 3 ] && break
  sleep 1
done
[ "$OKS" -ge 3 ] || { echo "El Postgres de prueba no arrancó"; exit 1; }

psql_q() { docker exec -i "$NAME" psql -U postgres -v ON_ERROR_STOP=1 -tA -c "$1"; }
psql_f() { docker exec -i "$NAME" psql -U postgres -v ON_ERROR_STOP=1 -q -f - < "$1" >/dev/null; }
FAILED=0
# Ejecuta SQL esperando que falle y devuelve su mensaje de error (sin pipes, para que pipefail no engañe).
sql_error() { local out; out=$(docker exec -i "$NAME" psql -U postgres -tA -c "$1" 2>&1 || true); echo "$out"; }
has() { case "$1" in *"$2"*) echo si ;; *) echo no ;; esac; }
check() { # descripción, esperado, obtenido
  if [ "$2" = "$3" ]; then echo "  ok   $1 ($3)"; else echo "  FALLA $1: esperado «$2», obtenido «$3»"; FAILED=1; fi
}

echo "== Preparación: roles de Supabase y estado actual (tabla exercises antigua con su seed)"
# Roles y privilegios por defecto como en Supabase: authenticated y service_role reciben todo en las tablas nuevas del esquema public
# (la migración se encarga de quitar lo que no deba tener); anon no recibe nada (tras la migración de endurecimiento de seguridad).
psql_q "create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
        grant usage on schema public to anon, authenticated, service_role;
        alter default privileges in schema public grant all on tables to authenticated, service_role;" >/dev/null
psql_f "$OLD_1"; psql_f "$OLD_2"
LEGACY_HASH_SQL="select md5(string_agg(t::text, '|' order by slug)) from public.%s t"
H0=$(psql_q "$(printf "$LEGACY_HASH_SQL" exercises)")
check "tabla antigua con sus filas" "41" "$(psql_q 'select count(*) from public.exercises')"

echo "== IDA: migración nueva"
psql_f "$UP"
check "exercises (nueva) · filas" "1553" "$(psql_q 'select count(*) from public.exercises')"
check "exercise_categories · filas" "47" "$(psql_q 'select count(*) from public.exercise_categories')"
check "exercises_legacy · filas" "41" "$(psql_q 'select count(*) from public.exercises_legacy')"
check "legacy intacta (hash idéntico)" "$H0" "$(psql_q "$(printf "$LEGACY_HASH_SQL" exercises_legacy)")"
check "fichas curadas migradas (legacy_slug)" "41" "$(psql_q 'select count(*) from public.exercises where legacy_slug is not null')"
check "plan_eligible" "41" "$(psql_q 'select count(*) from public.exercises where plan_eligible')"
check "plan_eligible solo si reviewed" "0" "$(psql_q "select count(*) from public.exercises where plan_eligible and review_status <> 'reviewed'")"
check "fit_sdk_known = false" "59" "$(psql_q 'select count(*) from public.exercises where not fit_sdk_known')"
check "muscles_source nulo (sin músculos)" "52" "$(psql_q 'select count(*) from public.exercises where muscles_source is null')"
check "alternativas apuntan a claves que existen" "0" "$(psql_q "select count(*) from public.exercises e, unnest(e.alternatives) a where not exists (select 1 from public.exercises x where x.garmin_category || '/' || x.garmin_name = a)")"
check "RLS activada en las 3 tablas nuevas" "3" "$(psql_q "select count(*) from pg_class where relname in ('exercises','exercise_categories','exercise_animations') and relrowsecurity")"
check "authenticated lee el catálogo" "1553" "$(psql_q "set role authenticated; select count(*) from public.exercises" | grep -E '^[0-9]+$')"
check "anon no puede leer (sin permisos)" "si" "$(has "$(sql_error "set role anon; select count(*) from public.exercises")" 'permission denied')"
check "authenticated no puede escribir" "si" "$(has "$(sql_error "set role authenticated; insert into public.exercise_categories values ('X','x','x')")" 'permission denied')"
check "service_role puede escribir (RLS no aplica)" "1" "$(psql_q "set role service_role; insert into public.exercise_categories values ('ZZ_TEST','x','x'); select count(*) from public.exercise_categories where garmin_category='ZZ_TEST'; delete from public.exercise_categories where garmin_category='ZZ_TEST'" | grep -E '^[0-9]+$' | head -1)"
check "la restricción plan_eligible⇒reviewed funciona" "si" "$(has "$(sql_error "update public.exercises set plan_eligible=true where id=(select id from public.exercises where review_status='draft' limit 1)")" 'exercises_plan_eligible_reviewed')"

echo "== VUELTA: script de rollback"
psql_f "$DOWN"
check "exercises vuelve a ser la antigua (columna slug)" "1" "$(psql_q "select count(*) from information_schema.columns where table_schema='public' and table_name='exercises' and column_name='slug'")"
check "exercises antigua · filas" "41" "$(psql_q 'select count(*) from public.exercises')"
check "tabla antigua idéntica tras la vuelta (hash)" "$H0" "$(psql_q "$(printf "$LEGACY_HASH_SQL" exercises)")"
check "tablas nuevas eliminadas" "0" "$(psql_q "select count(*) from pg_class where relname in ('exercises_legacy','exercise_categories','exercise_animations')")"
check "índices con su nombre original" "2" "$(psql_q "select count(*) from pg_indexes where schemaname='public' and indexname in ('exercises_pkey','exercises_slug_key')")"
check "política con su nombre original" "exercises_read_authenticated" "$(psql_q "select policyname from pg_policies where tablename='exercises'")"
check "authenticated sigue leyendo la antigua" "41" "$(psql_q "set role authenticated; select count(*) from public.exercises" | grep -E '^[0-9]+$')"
echo "-- la vuelta no se puede repetir (debe negarse sin tocar nada)"
SECOND=$(docker exec -i "$NAME" psql -U postgres -v ON_ERROR_STOP=1 -q -f - < "$DOWN" 2>&1 || true)
check "segunda vuelta rechazada" "si" "$(has "$SECOND" 'No existe public.exercises_legacy')"
check "tras el intento, la antigua sigue intacta" "$H0" "$(psql_q "$(printf "$LEGACY_HASH_SQL" exercises)")"

echo "== IDA otra vez (la migración se puede volver a aplicar tras una vuelta)"
psql_f "$UP"
check "exercises (nueva) · filas" "1553" "$(psql_q 'select count(*) from public.exercises')"
check "legacy intacta (hash idéntico)" "$H0" "$(psql_q "$(printf "$LEGACY_HASH_SQL" exercises_legacy)")"

if [ "$FAILED" -ne 0 ]; then echo "RESULTADO: HAY FALLOS"; exit 1; fi
echo "RESULTADO: OK (ida, vuelta e ida otra vez)"
