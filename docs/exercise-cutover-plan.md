# Plan de corte: tabla `exercises` → catálogo nuevo

Estado: **la migración NO está aplicada en producción.** Se aplicará en un único despliegue, junto con el código que lee el esquema
nuevo, al final de la Fase 4. Esta página es el inventario de lo que toca la tabla hoy y el plan para hacer el corte sin riesgo.

## 1. Inventario: qué lee o escribe `exercises` hoy (auditado 2026-11-12)

**Producción (datos reales):** 41 filas en `public.exercises`; sin claves foráneas, vistas ni funciones que dependan de ella.

### Código que lee o escribe la TABLA `exercises`
**Ninguno en tiempo de ejecución** (ni la web ni el bot hacen `.from("exercises")`). Solo la tocan:

| Quién | Cómo | Impacto del corte |
|---|---|---|
| `supabase/migrations/20261102202722_strength_library.sql`, `…202859_seed_strength_library.sql` | Crean y siembran la tabla (histórico, ya aplicado) | Ninguno: no se reescriben. |
| `lib/strength/seed.ts` + `seed.test.ts` (`npm run seed:strength`) | Generan ese SQL de seed a partir de `library.ts` | Quedan como **legado**: tras el corte ya no hay que ejecutar `seed:strength`. El test sigue pasando (compara con el fichero histórico). |
| `supabase/rls_checks.sql` (2 comprobaciones) | `select count(*) from public.exercises` (autenticado >0, anónimo = 0) | Sigue válido: tras el corte lee la tabla nueva. Ajustar el comentario. |
| `lib/supabase/database.types.ts` | Tipo generado de `exercises` | **Regenerar** tras aplicar la migración (cambia la forma de `exercises`; añade `exercise_categories`, `exercise_animations`, `exercises_legacy`). Nadie importa hoy ese tipo en código de app. |
| `lib/exercises/*`, `scripts/*` (Fase 1) | Generan la migración nueva y la validan | Nuevos; sin dependencia de producción. |

### Código que usa la biblioteca EN CÓDIGO (`lib/strength/library.ts`), no la tabla
Es la fuente de verdad real del módulo de fuerza. **No cambia con el corte.**
`lib/strength/`: `engine.ts`, `validator.ts`, `steps.ts`, `garmin-map.ts`, `history.ts`, `antidote.ts`, `ai.ts`, `seed.ts` (+ tests) ·
`components/strength/`: `ExerciseCard.tsx`, `ExerciseList.tsx`, `LiveWorkout.tsx` · `app/ui/poses/page.tsx` (galería de desarrollo).

### Otras tablas con referencias a ejercicios (sin FK a `exercises`)
| Tabla | Columna | Quién escribe | Observación |
|---|---|---|---|
| `strength_sessions` | `exercise` (nombre), `exercise_slug` | `app/fuerza/entreno/actions.ts` (ambas) y el bot `save_strength_exercises` (solo `exercise`, nombre en español de Garmin) | Las 46 filas actuales tienen `exercise_slug` NULL. Sin FK: el corte no las toca. |
| `strength_workouts` | JSON de bloques con `slug` de ejercicio | `lib/strength/service.ts` | Los slugs son los de `library.ts`, que siguen existiendo (`legacy_slug` en la tabla nueva los conserva). |

### Código NUEVO que lee el esquema nuevo (Fase 4)
Solo funciona cuando la migración está aplicada; antes, `/ejercicios` muestra «El catálogo de ejercicios no está disponible todavía» (no se rompe), pero **no debe desplegarse antes del corte**.
`app/ejercicios/page.tsx`, `app/ejercicios/[id]/page.tsx` y `lib/exercises/data.ts` (`exercises`, `exercise_categories`; paginado por el límite de 1.000 filas); enlace en `app/fuerza/page.tsx`.
`ExercisePicker` está exportado pero sin conectar al módulo de fuerza. `/ui/preview/ejercicios` y `/dev/rigs` no usan la base de datos y dan 404 en producción.

## 2. Por qué el corte es de bajo riesgo
Como **ningún código de producción lee la tabla**, la migración puede aplicarse **antes** de desplegar el código nuevo sin romper
nada en ningún momento (el código viejo ni la menciona). Y si el despliegue nuevo falla, basta promover el anterior en Vercel:
la base de datos es compatible con ambos. Solo el paso de deshacer la base de datos pierde datos (ver §4).

## 3. Plan de corte (un único despliegue, al final de la Fase 4)
**Antes**
1. Congelar cambios en `lib/strength/library.ts` y en `data/` hasta el corte.
2. `npm run gen:exercise-catalog` y `npx vitest run`: los ficheros versionados coinciden con lo generado.
3. `bash scripts/test-exercise-migration.sh`: ida, vuelta e ida otra vez en un Postgres desechable (hecho; repetir sobre el commit final).
4. Probar la migración en una **rama de Supabase** con una copia de los datos y pasar `supabase/rls_checks.sql`.
5. `pg_dump` de `public.exercises` (41 filas) como copia de seguridad.
6. Preview de Vercel del código nuevo apuntando a la rama de Supabase.

**Corte**
7. Aplicar `supabase/migrations/20261112120000_exercise_catalog.sql` (transaccional: o se aplica entera o nada).
8. Comprobar (SQL): `exercises`=1.553 · `exercise_categories`=47 · `exercises_legacy`=41 · `plan_eligible`=41 · `fit_sdk_known=false`=59 · RLS activa en las 3 tablas nuevas.
9. Regenerar `lib/supabase/database.types.ts` y **tipar** las consultas de `lib/exercises/data.ts` (hoy usan un cliente sin tipos y validan cada fila a mano).
10. Desplegar la web (fusión a `main`).
11. Humo: `/ejercicios` carga las 1.553 filas, el buscador responde, una ficha con animación (p. ej. rotación torácica) y una sin ella se abren, `/ejercicios/<id>` funciona, el módulo de fuerza genera y envía una rutina.

**Si algo falla**
- Solo el código → promover el despliegue anterior en Vercel. La base de datos no hace falta tocarla.
- Hay que deshacer la base de datos → `supabase/rollbacks/20261112120000_exercise_catalog.down.sql` (fuera de `migrations/` a propósito).
  Se niega a ejecutarse si el estado no es el esperado. **Pierde lo escrito en las tablas nuevas** (revisiones, animaciones): `pg_dump` antes.

## 4. Limpieza posterior (≥ 2 semanas después, con todo verificado)
- Migración que elimina `exercises_legacy` (y las poses `pose_a/pose_b` si ya no se usan: las sustituye el motor de animación).
- Retirar `lib/strength/seed.ts`, `seed.test.ts` y el script `seed:strength` (la migración histórica del seed no se toca).
- Decidir si el módulo de fuerza pasa a leer el catálogo de la base de datos. Mientras no, `library.ts` sigue siendo la fuente del motor y
  un test garantiza que las 41 fichas curadas del catálogo son exactamente las de `library.ts`.
