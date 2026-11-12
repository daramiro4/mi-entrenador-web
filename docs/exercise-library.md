# Biblioteca de ejercicios (catálogo de Garmin)

Catálogo de los ejercicios que el reloj acepta en un entreno de fuerza (categoría + nombre de ejercicio), con metadatos
para el módulo de fuerza y, más adelante, ficha animada. **Estado: Fase 1 (datos) y Fase 2 (motor de animación) hechas; Fase 3 (contenido) en la PARADA 3.** La UI (fase 4) no está hecha. La migración está probada en local e **sin aplicar** en producción: ver `docs/exercise-cutover-plan.md`.

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

## Modelo (migración `20261112120000_exercise_catalog.sql`, SIN aplicar en producción)

- `exercise_categories`, `exercises` (nueva), `exercise_animations`. RLS: lectura para `authenticated`; sin permisos para `anon`; escritura solo migraciones / service_role.
- **Reversible:** `supabase/rollbacks/20261112120000_exercise_catalog.down.sql` (fuera de `migrations/`). Probada ida, vuelta e ida otra vez
  en un Postgres desechable: `bash scripts/test-exercise-migration.sh` (Docker, sin publicar puertos).
- Sustituye a la tabla `exercises` actual **sin perder datos**: la antigua pasa a `exercises_legacy` (con sus poses y 41 filas) y no se borra en la migración.
  Las 41 fichas curadas se migran a la tabla nueva (`legacy_slug`, cues, error común, alternativas, contraindicaciones, `leg_load`…) como `reviewed`.
  Las poses `pose_a/pose_b` siguen en `exercises_legacy` y en `lib/strength/poses.ts` hasta que el motor de animación las sustituya.
- Columnas de control:
  - `review_status` (`draft` | `reviewed`) y **`plan_eligible`** (default false): true solo si `reviewed` con nivel, y **nunca olímpicos ni pliométricos**
    salvo decisión explícita en `data/exercise-overrides.json`. Una restricción de la tabla impide `plan_eligible` sin `reviewed`.
  - **`muscles_source`** (`exercises_json` | `curated` | `manual` | null): origen de los músculos, para poder sustituirlos antes de abrir la app a más usuarios.
  - **`fit_sdk_known`**: false en las claves que Garmin Connect acepta pero el FIT SDK 21.221 aún no lista (`data/sources/fit-sdk-unknown-keys.json`; solo nuestras claves).
- `alternatives`: claves completas `CATEGORÍA/EJERCICIO` (el nombre de Garmin solo no es único: 27 se repiten entre categorías; una alternativa "CRUNCH" podía apuntar a otro ejercicio).
- Equipo **conservador**: lo que indica el nombre; sin pista, `unknown`. `bodyweight` solo con `BODY_WEIGHT` en la clave, categoría de calentamiento o ficha curada.
  Distribución actual (un ejercicio puede tener varios): unknown 791 · dumbbell 144 · barbell 110 · bodyweight 88 · stability_ball 86 · band 62 · bench 42 · cable 40 ·
  suspension 38 · battle_rope 29 · medicine_ball 29 · pull_up_bar 29 · box 22 · sandbag 21 · kettlebell 18 · rings 15 · machine 14 · bosu 12 · sled 8 · plate 4 · ladder 3 · sledgehammer 3 · tire 2.
- Patrón de movimiento por categoría (null si la categoría es heterogénea); niveles y dosis solo en las curadas.

## Correcciones manuales (`data/exercise-overrides.json`)
Se aplican **siempre encima** de lo importado y de las fichas curadas: regenerar nunca las pisa. Clave `"CATEGORÍA/EJERCICIO"`; campos permitidos:
`name_es, equipment, primary_muscles, secondary_muscles, movement_pattern, level, dose_default, cues, common_mistake, alternatives, review_status, plan_eligible`.
Un override a un ejercicio inexistente o con un campo no permitido hace fallar el generador. Hoy está **vacío a propósito**: ninguna ficha curada permite
rellenar los 52 músculos que faltan sin inventarlos (solo 2 son curadas: retracción cervical y rotación torácica, y su ficha no dice qué músculos trabajan).

## Informe de emparejamiento (`docs/curated-mapping-review.md`)
Para las 41 fichas curadas: clave de Garmin asignada, 3 candidatas por parecido de nombre y material, y avisos. **Solo informe**; el cambio de emparejamiento lo decide el responsable.

## Huecos conocidos
- Solo ~17 % de los nombres están en español (41 curados + 230 automáticos); el resto en inglés a propósito. La traducción se hace al inicio de la Fase 3.
- 52 ejercicios sin músculo primario; 385 sin patrón de movimiento (cardio, pliométricos, olímpicos…); 791 con equipo `unknown`.
- 59 claves no están en el FIT SDK 21.221 (`fit_sdk_known=false`).
- Fichas curadas con emparejamiento dudoso: ver el informe de emparejamiento (14 de 41 con algún aviso).

## Motor de animación (Fase 2)

SVG puro, sin librerías de animación. Código en `lib/exercises/rig/` (puro, con tests) y `components/exercises/`.

- **Rig** (`rig/types.ts`): articulaciones NOMBRADAS en un lienzo de 480×300 con el suelo en y=254; `poses` = `[{ t: 0..1, joints }]`; los **huesos se dibujan entre
  articulaciones** en cada fotograma, así el escorzo de un movimiento fuera de plano sale de la proyección 2D sin escalar nada. `phases` con subtítulo por fase
  (y paso numerado opcional), resalte muscular Volt con opacidad por fase, implementos (mancuerna, barra, banco, banda), espejo izquierda/derecha.
- **Interpolación** (`rig/interpolate.ts`): lerp + suavizado cúbico por tramo (`"eased"`, rigs con pocas poses a mano) o lineal (`"linear"`, rigs con muchas poses
  muestreadas de una cinemática: así los huesos no se acortan a mitad de un giro y no hay paradas entre poses).
- **Validador** (`rig/validate.ts`): ningún hueso cambia de longitud más de un **8 %** salvo los marcados `foreshortened`; bucle cerrado; dentro del lienzo y sin atravesar el suelo;
  fases sin huecos; bucle de 4-8 s.
- **Cinemática** (`rig/fk.ts`, `rig/skeleton.ts`): FK/IK de 2 huesos para construir poses con longitudes constantes.
- **Componentes**: `RigStage` (un fotograma), `ExerciseAnimation` (bucle con rAF, pausa, cambio de lado, subtítulo por fase, resalte, pasos sincronizados; con
  `prefers-reduced-motion` muestra la pose inicial estática), `ExerciseStaticPoses` (ficha de respaldo: pose inicial y final estáticas + músculo + dosis, sin técnica inventada).
- **Herramienta** `/dev/rigs` (solo con `next dev`; 404 en producción): fotogramas, reproductor, editor (arrastrar articulaciones, marcar escorzos, validar en vivo, exportar JSON).
- **Arquetipos** (`rig/archetypes/`): 17 previstos; **listos 3** (`squat`, `hip_hinge`, `quadruped_rotation`); el resto `pending`. Cada uno se carga **bajo demanda** (import dinámico).
- **Mapa** `animation-map.ts`: ejercicio de Garmin → arquetipo + parámetros (hoy 6 ejercicios). Sin entrada = sin animación.
- Los rigs viven en código; `exercise_animations` / `exercises.animation_id` de la base de datos quedan sin usar hasta la Fase 4.
- Los pasos numerados de un rig solo existen si hay técnica verificada: la rotación torácica usa exactamente las 3 claves de su ficha curada; los arquetipos genéricos no traen pasos.

## Contenido priorizado (Fase 3)

**80 ejercicios** en borrador, escritos en `data/exercise-overrides.json` (se aplican encima de lo importado; regenerar no los pisa) y listados para revisión en
`docs/exercise-content-review.md` (generado, con tabla por zona y ficha completa de cada uno). Zonas: movilidad torácica, de cadera y cuello (18) · glúteo y
estabilidad de cadera (11) · bisagra e isquiotibiales (5) · core (12) · espalda alta y hombros (11) · empuje (7) · tirón vertical y bíceps (3) · sentadilla y zancada (10) · pantorrilla y trapecio (3).
Perfil: sedentario que conduce mucho, entrena por salud, con gimnasio, mancuernas, banda y peso corporal. Sin olímpicos ni pliométricos.

Cada ejercicio trae: nombre en español, nivel (1-3), arquetipo de animación previsto, dosis, 1-3 claves en imperativo, error común y 1-2 alternativas (que existen en el catálogo).
**Sin consejos médicos ni contraindicaciones** (un test lo vigila). `review_status = draft` y `plan_eligible = false` para todos: solo los marcas `reviewed` tú.

- **Nombres en español:** el nombre propuesto queda en estado `proposed`; cuando lo apruebes, márcalo `reviewed` en `data/exercise-names-es.csv` (esa revisión manda sobre cualquier propuesta o corrección y sobrevive a regenerar).
  Cobertura actual: 41 curados + 80 propuestos + 203 automáticos = **20,9 %**; el resto sigue en inglés a propósito.
- **Arquetipo (`archetype`)**: tipo de animación previsto. Solo 3 de los 17 tienen rig (`squat`, `hip_hinge`, `quadruped_rotation`); el resto está `pending`. Asignar arquetipo NO crea la animación:
  las entradas ejecutables siguen siendo `lib/exercises/animation-map.ts` (hoy 6 ejercicios).
- Los músculos de estos 80 son los de Exercises.json (`muscles_source = exercises_json`); no se han tocado.
