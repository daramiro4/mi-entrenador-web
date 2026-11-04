# Envío de rutinas de fuerza al Forerunner

Estado: **implementado y probado de punta a punta con un Garmin simulado; el envío real está DESACTIVADO por defecto**
(`GARMIN_SEND_ENABLED` sin definir). Falta la primera prueba real con tu reloj (abajo).

## Cómo funciona
La web construye el entreno en el formato de Garmin y lo manda al servicio del **bot** (`mi-entrenador-garmin`, función
`api/send_strength.py`), que ya tiene las credenciales de Garmin y el mismo login/`upload_workout` que usa el envío de bici.
Autenticación entre repos: el mismo secreto compartido que ya protege `send_workout` (`GARMIN_SEND_SECRET`). No hay credenciales
de Garmin en el proyecto web.

| Pieza | Dónde |
|---|---|
| Traducción rutina → JSON de Garmin (dry-run) | `lib/strength/garmin-map.ts` (+ correcciones del catálogo en `garmin-overrides.ts`) |
| Orquestación + interruptor + llamada al bot | `lib/strength/garmin-send.ts`, acción `app/fuerza/garmin-actions.ts`, API `POST /api/fuerza/garmin` |
| Servicio de envío (Python, serverless) | repo `mi-entrenador-garmin`: `api/send_strength.py` (+ `api/strength_payload.py`) |
| Validación contra el catálogo de Garmin | `scripts/validate_garmin_mapping.py` |
| Prueba manual alternativa (script directo) | `scripts/garmin_smoke_test.py` |

Versión de la librería comprobada en el código fuente: **garminconnect 0.3.20**. Métodos usados por el bot:
`Garmin(email, password).login()`, `upload_workout(dict)`, `schedule_workout(workout_id, "YYYY-MM-DD")`.

## Mapeo de ejercicios
Los 41 ejercicios de la biblioteca coinciden con el catálogo real (`python scripts/validate_garmin_mapping.py` → `41/41`, incluye las correcciones). Con Python < 3.12 se puede validar el catálogo extrayendo `garminconnect/exercises.py` de la rueda a un paquete vacío y apuntando `PYTHONPATH` a él.
Correcciones aplicadas al enviar (`lib/strength/garmin-overrides.ts`, la siembra de la base no cambia): peso muerto con kettlebell → `DEADLIFT/KETTLEBELL_DEADLIFT`, peso muerto a una pierna → `DEADLIFT/SINGLE_LEG_ROMANIAN_DEADLIFT_WITH_DUMBBELL`, remo con banda → `BANDED_EXERCISES/ROW`.
Aproximaciones (no hay entrada exacta en el catálogo; hip thrust con mancuerna usa la variante con barra): Pallof → `CORE/CABLE_CORE_PRESS`, bird dog → `HIP_STABILITY/QUADRUPED_WITH_LEG_LIFT`,
retracción cervical → `WARM_UP/STRETCH_NECK`, sentadilla a la caja → `SQUAT/SQUAT`. El nombre en español viaja siempre en la descripción del paso.
Si algún ejercicio no existiera, se envía como paso genérico (`TOTAL_BODY`, nombre en la descripción) y la vista previa lo avisa.

## Formatos: qué se pudo y qué no
| Formato | En el reloj |
|---|---|
| **Fuerza completa** (el único que se genera hoy) | Un bloque nativo "3 series" por ejercicio (grupo de repetición con ejercicio + descanso, igual que `create_strength_set` de garminconnect): el reloj muestra "Serie 2 de 3". Calentamiento por tiempo antes. ✔ |
| Circuito, Contrarreloj | Grupo de repetición por rondas (ejercicio + descanso) ✔ |
| Pirámide | Un paso por escalón con sus repeticiones ✔ |
| EMOM | Pasos de 60 s; las repeticiones van en la descripción (el reloj no puede "empezar el minuto con N reps") — parcial |
| AMRAP | No existe "hasta el tiempo límite": se envían 4 rondas y el límite va en la descripción — parcial |
Los pesos van en gramos con unidad kilogramo, como espera Garmin. Las rutinas de movilidad/antídoto se envían como pasos por tiempo.

## Variables de entorno
En el proyecto **web** (Production):
| Variable | Para qué |
|---|---|
| `GARMIN_SEND_ENABLED` | `true` para permitir el envío real (por defecto apagado: la UI muestra "Próximamente"). Es lo único que falta por activar |
| `GARMIN_SEND_SERVICE_URL` | Ya existe (envío de bici). La de fuerza se deriva sola: `…/api/send_workout` → `…/api/send_strength` |
| `GARMIN_SEND_SECRET` | Ya existe. Mismo valor que en el proyecto del bot |
| `GARMIN_STRENGTH_SERVICE_URL` | Opcional: URL completa de `send_strength` si la derivada no sirve |
En el proyecto **bot**: `GARMIN_EMAIL`, `GARMIN_PASSWORD`, `GARMIN_SEND_SECRET` (ya existen). La función de fuerza no necesita Supabase.

## Probar en dry-run (sin tocar Garmin)
- API: `POST /api/fuerza/garmin {"workoutId": "<id>", "dry_run": true}` → devuelve el JSON que se enviaría + notas.
- Con el interruptor apagado, el botón también devuelve solo la vista previa.
- Tests: web `npx vitest run lib/strength/garmin-map.test.ts lib/strength/garmin-send.test.ts`; bot `python3 -m unittest discover -s tests` (incluye el endpoint completo con un Garmin simulado).

## Prueba real (la haces tú, desde la propia app)
1. Con el bot desplegado y `GARMIN_SEND_ENABLED=true` en la web (y redespliegue), abre Fuerza → "Enviar al Forerunner".
2. Revisa la vista previa, elige **Mañana** (para no mezclarlo con lo de hoy) y confirma.
3. Abre Garmin Connect → Entrenamientos y comprueba que aparece, con los nombres de ejercicio, las 3 series y el descanso. Sincroniza el Forerunner.
4. En el reloj: *Fuerza → Entrenamientos*. Comprueba que muestra "Serie 1 de 3", el peso (si lo hay) y la plancha por tiempo.
5. Bórralo desde Garmin Connect (⋯ → Eliminar) si era una prueba.
El servicio hace **un** intento de login y limita a un envío cada 20 s. Si falla el login, no reintentes en bucle (riesgo de bloqueo de cuenta).

## Seguridad y límites
- El servicio exige el secreto compartido (`Authorization: Bearer`), solo acepta entrenos `strength_training`, cuerpo ≤ 200 KB, ≤ 200 pasos de primer nivel (≤ 400 contando los de dentro de los grupos) y fecha `YYYY-MM-DD`.
- Un envío cada 20 s por instancia; un solo intento de login, sin reintentos.
- Interruptor global `GARMIN_SEND_ENABLED` en la web.
- El Edge 1040 no se usa para fuerza y no se integra.
- La tabla `garmin_tokens` (RLS sin políticas) y la función `api/garmin_strength.py` del diseño anterior ya no se usan: el login se hace en el bot, como el envío de bici.
