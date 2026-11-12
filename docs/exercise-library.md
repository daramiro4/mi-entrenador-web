# Biblioteca de ejercicios (catálogo de Garmin)

Catálogo de los ejercicios que el reloj acepta en un entreno de fuerza (categoría + nombre de ejercicio), con metadatos
para el módulo de fuerza y, más adelante, ficha animada. **Estado: Fase 1 (datos).** Las fases 2-4 (animación, contenido, UI) no están hechas.

## Cifras reales (2026-11-12)

| Fuente | Categorías | Ejercicios | Para qué |
|---|---|---|---|
| FIT SDK 21.221.0 (`@garmin/fitsdk`) | 53 | 1.846 | Solo validar en local. Incluye categorías que el editor no ofrece (run, pose, move…). |
| Exercises.json de Garmin Connect (público, sin login) | 47 | 1.536 | **Solo músculos** (1.501 con músculo primario, 18 grupos). |
| python-garminconnect 0.3.20 (MIT, la del bot) | 47 | 1.527 | **Claves y nombres visibles.** |
| **Catálogo resultante** (unión de las dos últimas) | **47** | **1.553** | Lo que se importa y se envía al reloj. |

La cifra de ~1.600 ejercicios / 49 categorías de terceros (Terra) no coincide con ninguna fuente oficial. La real que acepta
el editor es ~1.550 en 47 categorías. 26 ejercicios solo existen en Exercises.json (nombre derivado de la clave) y 17 solo en garminconnect (sin músculos).

## Licencias

- **FIT SDK** (`LICENSE.txt` del paquete): licencia no exclusiva, intransferible y **no sublicenciable** para uso interno; prohíbe
  distribuir, publicar o poner a disposición de terceros el SDK o sus funciones, y lo declara información confidencial.
  **Decisión:** el SDK solo se usa para validar en local (`.cache/`, ignorado por git); no se versiona nada derivado de él.
- **python-garminconnect**: MIT. Se versionan las claves y nombres visibles (`data/sources/garminconnect-exercises.json`).
- **Exercises.json de Garmin Connect**: fichero público sin licencia explícita. Se guarda **solo** la tabla clave → músculos
  (`data/sources/connect-exercise-muscles.json`); ni imágenes, ni vídeos, ni textos de Garmin. Es una zona gris para el paso a multiusuario:
  uso personal hoy; antes de abrir la app a terceros, revisar con Garmin o sustituir los músculos por un dato propio.
- No se raspa nada tras login.

## Pipeline (reproducible)

```
npm run import:garmin-exercises            # red: baja las fuentes a data/sources/*.json (+ --fit-sdk → .cache/)
npm run gen:exercise-catalog               # offline: data/garmin-exercises.json + data/exercise-names-es.csv + migración SQL
node scripts/validate-garmin-keys.ts [--fit-sdk]   # valida claves contra las fuentes y la migración
npx vitest run lib/exercises               # los ficheros versionados deben coincidir con lo generado
```

`lib/exercises/catalog.ts` es el constructor puro; `names-es.ts` los nombres en español; `garmin-step.ts` el paso de fuerza para el reloj.

### Nombres en español

Diccionario determinista y conservador: un nombre se traduce solo si todas sus piezas son conocidas; si no, **se deja el inglés**
(estado `en`) y no se inventa. `data/exercise-names-es.csv` es el borrador revisable: cualquier fila que cambies a mano y marques
`reviewed` se conserva al regenerar. Estados: `curated` (fichas del módulo de fuerza), `reviewed` (a mano), `auto` (diccionario), `en`.

## Modelo (migración `20261112120000_exercise_catalog.sql`, SIN aplicar todavía)

- `exercise_categories`, `exercises` (nueva), `exercise_animations`. RLS: lectura para `authenticated`; escritura solo migraciones / service_role.
- `review_status`: `draft` (importado) o `reviewed` (fichas curadas). El futuro motor solo propondrá `reviewed` con `level`.
- **Sustitución de la tabla `exercises` actual**: se renombra a `exercises_legacy` (con sus poses y 41 filas) y NO se borra en la
  migración. Las 41 fichas curadas se migran a la tabla nueva (`legacy_slug`, cues, error común, alternativas, contraindicaciones, `leg_load`…).
  Las poses `pose_a/pose_b` siguen en `exercises_legacy` y en `lib/strength/poses.ts` hasta que la Fase 2 las sustituya.
  Rollback y borrado de `exercises_legacy`: ver cabecera de la migración.
- Equipo derivado del nombre; patrón de movimiento por categoría (null si la categoría es heterogénea); niveles y dosis solo en las curadas.

## Huecos conocidos (Fase 1)

- Solo ~17 % de los nombres están en español (41 curados + 230 automáticos); el resto queda en inglés a propósito.
- 52 ejercicios sin músculo primario; 385 sin patrón de movimiento (cardio, pliométricos, olímpicos…).
- 59 claves del catálogo no están en el FIT SDK 21.221 (Connect es más reciente que el SDK; solo aviso).
- Algunas fichas curadas apuntan a un ejercicio de Garmin que no es exactamente el suyo (p. ej. "Puente de glúteo" →
  `BARBELL_HIP_THRUST_ON_FLOOR`, "Buenos días" → `LEG_CURL/GOOD_MORNING`, "Sentadilla a la caja" → `SQUAT/SQUAT`). Heredado del emparejamiento anterior: revisar.
