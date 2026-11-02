# Envío de rutinas de fuerza al Forerunner

Estado: **implementado y probado en dry-run; envío real DESACTIVADO por defecto** (`GARMIN_SEND_ENABLED=false`).
La prueba real la haces tú con `scripts/garmin_smoke_test.py` (abajo).

## Qué hay
| Pieza | Dónde |
|---|---|
| Traducción rutina → JSON de Garmin (dry-run) | `lib/strength/garmin-map.ts` (tests: `garmin-map.test.ts`) |
| Orquestación + interruptor | `lib/strength/garmin-send.ts`, acción `app/fuerza/garmin-actions.ts`, API `POST /api/fuerza/garmin` |
| Servicio de envío (Python, serverless) | `api/garmin_strength.py` (+ `requirements.txt`, `.python-version`) |
| Validación contra el catálogo de Garmin | `scripts/validate_garmin_mapping.py` |
| Prueba manual | `scripts/garmin_smoke_test.py` |

Versión de la librería comprobada en el código fuente: **garminconnect 0.3.20** (Python ≥ 3.12). Métodos reales usados:
`Garmin(email, password).login(tokenstore=<json|ruta>)`, `client.dumps()`, `upload_workout(dict)`,
`schedule_workout(workout_id, "YYYY-MM-DD")`, `delete_workout(id)`; modelos tipados `garminconnect.workout.StrengthWorkout`,
`create_strength_set`, `create_strength_timed_set`; catálogo `garminconnect.exercises` (1527 ejercicios, 47 categorías).

## Mapeo de ejercicios
Los 41 ejercicios de la biblioteca coinciden con el catálogo real (`python scripts/validate_garmin_mapping.py` → `41/41`).
Aproximaciones (no hay entrada exacta en el catálogo): Pallof → `CORE/CABLE_CORE_PRESS`, bird dog → `HIP_STABILITY/QUADRUPED_WITH_LEG_LIFT`,
retracción cervical → `WARM_UP/STRETCH_NECK`, sentadilla a la caja → `SQUAT/SQUAT`. El nombre en español viaja siempre en la descripción del paso.
Si algún ejercicio no existiera, se envía como paso genérico (`TOTAL_BODY`, nombre en la descripción) y la vista previa lo avisa.

## Formatos: qué se pudo y qué no
| Formato | En el reloj |
|---|---|
| Circuito, Contrarreloj | Grupo de repetición por rondas (ejercicio + descanso) ✔ |
| Pirámide | Un paso por escalón con sus repeticiones ✔ |
| EMOM | Pasos de 60 s; las repeticiones van en la descripción (el reloj no puede "empezar el minuto con N reps") — parcial |
| AMRAP | No existe "hasta el tiempo límite": se envían 4 rondas y el límite va en la descripción — parcial |
Los pesos van en gramos con unidad kilogramo, como espera Garmin. Las rutinas de movilidad/antídoto se envían como pasos por tiempo.

## Variables de entorno (solo servidor; nunca en el repo)
| Variable | Para qué |
|---|---|
| `GARMIN_SEND_ENABLED` | `true` para permitir el envío real (por defecto apagado: la UI muestra "Próximamente") |
| `GARMIN_EMAIL`, `GARMIN_PASSWORD` | Cuenta de Garmin Connect (solo la función Python) |
| `SUPABASE_SERVICE_ROLE_KEY` | Escribir/leer la tabla privada `garmin_tokens` (tipo Secret) |
| `GARMIN_STRENGTH_SERVICE_URL` | Opcional: URL completa de `/api/garmin_strength` (por defecto `https://$VERCEL_URL/api/garmin_strength`) |
`NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` ya existen y la función las reutiliza para validar la sesión del usuario.
**Aplica antes las migraciones** (`garmin_tokens` está en `20261102202723_strength_user_tables.sql`).

## Probar en dry-run (sin tocar Garmin)
- API: `POST /api/fuerza/garmin {"workoutId": "<id>", "dry_run": true}` → devuelve el JSON que se enviaría + notas.
- Script: `python scripts/garmin_smoke_test.py --dry-run`.
- Tests: `npx vitest run lib/strength/garmin-map.test.ts` y `python3 -m unittest scripts.test_garmin_strength`.
- Los payloads de los 5 formatos se validaron con el modelo pydantic `StrengthWorkout` de garminconnect 0.3.20.

## Prueba real (la haces tú)
1. En tu terminal (nunca dentro de Claude Code): `export GARMIN_EMAIL=… GARMIN_PASSWORD=…`
2. `pip install "garminconnect>=0.3.20"` (Python ≥ 3.12) y `python scripts/garmin_smoke_test.py`.
   Sube **PRUEBA Mi Entrenador** (4 ejercicios) y la programa para mañana; imprime su ID (no imprime credenciales).
3. Abre Garmin Connect → Entrenamientos y comprueba que aparece; sincroniza el Forerunner.
4. En el reloj: *Fuerza → Entrenamientos → PRUEBA Mi Entrenador*. Comprueba que muestra los nombres de ejercicio, las series, el descanso y la plancha por tiempo.
5. Bórrala: `python scripts/garmin_smoke_test.py --delete <ID>` (o desde Garmin Connect → ⋯ → Eliminar).
Solo hace **un** intento de login: si falla, no reintentes en bucle (riesgo de bloqueo de cuenta); espera unos minutos.

## Seguridad y límites
- El servicio exige sesión de Supabase válida, solo acepta entrenos `strength_training`, ≤ 200 KB y ≤ 200 pasos, y limita a 1 envío / 20 s por usuario.
- Fallo de autenticación o 429 de Garmin → cortacircuito de 15 min en la instancia, sin reintentos.
- Tokens de Garmin cacheados en `garmin_tokens` (RLS activado **sin políticas**: solo `service_role`).
- El Edge 1040 no se usa para fuerza y no se integra.
