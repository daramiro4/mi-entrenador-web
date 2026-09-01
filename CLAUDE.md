# Mi Entrenador — Contexto del proyecto (mi-entrenador-web)

## Qué es esto
Webapp de entrenador personal de ciclismo. Next.js + Supabase Auth + Tailwind, desplegado en Vercel (plan Hobby). Multi-usuario desde el diseño, aunque de uso personal por ahora.

## Stack y despliegue
- Next.js + Tailwind + Supabase Auth (magic link)
- Producción: https://mi-entrenador-web.vercel.app
- Proyecto Supabase: `exqohgqxcnzevaneqnmc`, región `eu-west-1`

## Esquema de Supabase relevante
- `profiles`, `seasons`, `daily_metrics`, `activities`, `strength_sessions`, `ftp_history`, `fatigue_index`, `workouts` ya existen.
- `planned_sessions` ya existe en Supabase (migración `supabase/migrations/20260831174042_create_planned_sessions.sql`): `id`, `user_id`, `season_id`, `date`, `workout_template_id` (FK a `workouts`, nullable), `session_type` (quality/z2/strength/rest), `planned_tss`, `status` (planned/done/skipped/postponed/degraded), `actual_activity_id` (FK a `activities`, nullable), `notes` (jsonb).
- `workouts` es una biblioteca de definiciones reutilizables (nombre, tipo, intervalos) — NO mezclar con instancias de plan día a día. Esa separación es intencional, no la rompas.
- RLS en todas las tablas de usuario: `auth.uid() = user_id`.

## Decisiones de arquitectura ya cerradas (no volver a discutir, solo implementar)

1. **Generación del plan**: semana a semana. Se genera la semana siguiente al cerrar la anterior (evento de cierre semanal). Nunca generar el macrociclo completo de golpe.

2. **TSS semanal como objetivo real** (enfoque tipo TrainerRoad): el número que importa es el TSS semanal total, no que cada día tenga una sesión fija e inamovible. La semana se reparte en una plantilla inicial, pero el motor persigue el total semanal.

3. **Redistribución de TSS perdido**: cuando una sesión se salta o se degrada, el usuario ELIGE a qué día mover ese TSS. El motor solo sugiere qué días son válidos, filtrando por reglas fisiológicas (ej. nunca alta intensidad el día siguiente a pierna pesada en gym). Nunca automatizar la elección del día.

4. **Capa diaria adaptativa** (consume `fatigue_index`, no lo recalcula):
   - Normal → sesión sin cambios
   - Precaución → se degrada (menos series/intensidad, o Z2 en vez de umbral), nunca se cancela del todo
   - Descanso → se pospone al hueco libre más próximo esa semana

5. **Fase de reaclimatación** (condicional, antes de "Base"): si han pasado más de 2-3 semanas desde la última actividad de ciclismo en `activities`, activar 3-5 días de solo Z1-Z2, sin test ni sesiones de calidad. Tabla de descuento sobre último `ftp_history` conocido:
   - < 2 semanas: 0% (sin reaclimatación)
   - 2-4 semanas: -5%
   - 4-8 semanas: -10%
   - 8+ semanas: -15% (tope)
   El ramp test real se programa al final de esta ventana (día 4-5), no en el onboarding.

6. **Anillo de fatiga simplificado**: se mantienen los 3 niveles actuales de `fatigue_index.recommendation` (normal/precaucion/descanso). La vista principal muestra lenguaje humano ("Recuperado", "Cuidado, vas cargado", "Necesitas descansar"), NO el ratio ACWR numérico. El número crudo solo aparece si el usuario expande/toca el anillo. Esto es solo presentación — no toca el cálculo ni el esquema.

7. **Narrativa semanal vía IA**: al cerrar semana, además de la decisión mecánica (sube/repite/inserta), generar un resumen textual breve con Gemini (mismo patrón que el resumen motivador diario del bot `mi-entrenador-garmin`) que contextualice el resultado — ej. TSS cumplido a pesar de días degradados, patrones recurrentes de precaución en el mismo día de la semana, progreso relativo simple sin lenguaje técnico. Esta narrativa es complementaria a la lógica determinista, no la sustituye.

8. **Señal de progreso entre tests de FTP**: % de TSS semanal objetivo cumplido, acumulado en el bloque actual. Puramente informativo — NUNCA dispara un recálculo automático de `target_ftp`. Solo el ramp test real cambia `target_ftp`/`ftp_history`.

9. **Todo en la webapp, nada en Telegram**: la interacción diaria (marcar hecho/saltar/posponer, editar semana, ver progreso) vive en el dashboard. Telegram queda aparcado.

10. **Envío a Garmin: manual**, vía botón en la sesión del día. Nunca automático.

## Reglas de trabajo
- No pegar nunca secretos (API keys, tokens, contraseñas) en el chat o en archivos versionados.
- Variables de entorno en Vercel con prefijo `NEXT_PUBLIC_` deben ser tipo "Config", no "Secret".
- `export` de variables de entorno se hace en la terminal normal, nunca dentro del prompt interactivo de Claude Code.
- Site URL / Redirect URLs de Supabase Auth deben apuntar a la URL de producción real de Vercel.

## Estado actual (Fase D — motor de plan)
Ya existe:
- La tabla `planned_sessions` en Supabase, con RLS (`supabase/migrations/20260831174042_create_planned_sessions.sql`).
- El motor puro de generación semanal (`lib/plan-generator.ts`): reparte TSS semanal en quality/z2/strength/rest, o genera la ventana de reaclimatación (decisión 5) si han pasado ≥14 días sin actividad de ciclismo. Aritmética de calendario compartida en `lib/week.ts`.
- Persistencia (`lib/planned-sessions.ts`) y orquestación (`lib/weekly-plan.ts: generateAndSaveWeeklyPlan`, que junta FTP/última actividad + motor + insert).
- Disparo de la **primera semana**: se genera una sola vez dentro de `submitOnboarding` (`app/onboarding/actions.ts`), justo tras crear la temporada — evita mutar datos en el render de un Server Component (ver `node_modules/next/dist/docs/01-app/02-guides/server-actions.md`). Las semanas siguientes las genera `DashboardSyncEffect` al montar el dashboard (ver decisión 1 más abajo).
- `WeeklyStrip` (`components/dashboard/WeeklyStrip.tsx`) ya pinta los 7 días con datos reales de `planned_sessions`; si la temporada no tiene sesiones generadas (p. ej. temporadas creadas antes de esta pieza), sigue mostrando el placeholder "Aún no hay sesiones planificadas."
- **Decisión 10 (envío manual a Garmin)**: hecho y verificado en producción contra una cuenta real. Botón "Enviar a Garmin" en `WeeklyStrip` (solo en sesiones `quality`/`z2`) → `app/dashboard/garmin-actions.ts` → servicio Python separado en el repo `mi-entrenador-garmin` (`api/send_workout.py`, función Vercel independiente del cron diario, mismo login nativo de `garminconnect`). `api/workout_builder.py` sintetiza el workout (bloque Z2 continuo, o calentamiento+intervalos+enfriamiento para calidad) a partir de `session_type`/`planned_tss`/FTP — no existe todavía una biblioteca de `workouts` real, así que esto es una traducción sintética, documentada como ajustable. Auth entre los dos repos vía secreto compartido (`GARMIN_SEND_SERVICE_URL`/`GARMIN_SEND_SECRET`, configurados en Vercel de ambos proyectos, no en el código).
- **Decisión 9 (marcar hecho/saltar/posponer)**: hecho. `WeeklyStrip` es Client Component — clic en un día abre `PlannedSessionActions` (`components/dashboard/PlannedSessionActions.tsx`) con Hecho/Saltar/Posponer, más "Deshacer" sobre una sesión ya resuelta. "Posponer" es la versión simple acordada: cualquier día libre/`rest` que quede en la semana (`lib/postpone.ts`), sin reglas fisiológicas todavía. "Deshacer" se bloquea si el salto redistribuyó TSS a otro día (ver decisión 3) — revertir sin más lo dejaría duplicado.
- **Decisión 3 (redistribución de TSS)**: hecho, acoplada al flujo de "Saltar". Al saltar una sesión con TSS, se ofrecen los días de la semana que ya tienen `quality`/`z2` sin resolver (`lib/redistribute.ts: getValidRedistributionDates`, reutiliza la única regla fisiológica que existe — nunca el día siguiente a `strength`). El TSS perdido se suma al `planned_tss` del día elegido; el salto guarda `notes.redistributed_to_session_id` para saber que no se puede deshacer.
- **Decisión 4 (capa diaria adaptativa)**: hecho. Aplica `lib/daily-adaptation.ts: computeDailyAdaptation` a la sesión de hoy: normal sin cambios, precaución degrada (quality→z2, o -25% TSS si ya era z2 — nunca cancela), descanso pospone automáticamente al hueco libre más próximo (reutiliza `getValidPostponeDates`, a diferencia de la decisión 3 que es elección manual). Lee `fatigue_index` del día exacto de hoy (`lib/metrics.ts: getFatigueIndexForDate`, no "el más reciente"). Naturalmente idempotente: una vez que la sesión de hoy deja de estar `planned`, no se vuelve a tocar.
- **Decisión 6 (anillo de fatiga con lenguaje humano)**: hecho. `FatigueRing` muestra por defecto la frase ("Recuperado"/"Cuidado, vas cargado"/"Necesitas descansar") en vez del ACWR — tocar el anillo alterna a la vista con el número crudo. Solo presentación, no toca `fatigue_index` ni su cálculo.
- **Decisión 8 (señal de progreso)**: hecho. `SeasonSummaryCard` muestra % de TSS cumplido desde el `ftp_history` más reciente hasta el fin de la semana actual (`lib/progress.ts: computeProgressSignal` — suma `planned_tss` de todas las sesiones del bloque como objetivo, y de las `done` como cumplido). Se oculta si no hay ningún `ftp_history` todavía. Puramente informativo, no toca `target_ftp`.
- **Decisión 1 (cierre semanal)**: hecho, versión simplificada. `app/dashboard/weekly-close-actions.ts: ensureCurrentWeekGeneratedAction` — al montar el dashboard, si la semana de hoy no tiene sesiones, se genera (idempotente, verificado sin duplicados en producción). No hay cron real ni distinción semana-1-vs-siguientes: siempre es "asegura que exista la semana de hoy".
- **Decisión 7 (narrativa semanal vía IA)**: hecho y verificado con una llamada real a Gemini. Tabla nueva `weekly_narratives` (migración `supabase/migrations/20260901172016_create_weekly_narratives.sql`). Se genera dentro de `ensureCurrentWeekGeneratedAction`, justo en el momento en que detecta que la semana anterior cerró (antes de generar la nueva) — `lib/narrative.ts` construye el prompt desde el TSS/sesiones reales de esa semana y llama a `gemini-3.6-flash` (mismo endpoint que `mi-entrenador-garmin/main.py`). `try/catch` que nunca bloquea la generación de la semana nueva si Gemini falla. **Recorte deliberado**: no menciona ninguna decisión de "sube/repite/inserta" (esa progresión de bloque no existe en el código ni tiene fórmula en ningún sitio de este documento) ni detecta patrones entre varias semanas (solo tiene datos de la semana que acaba de cerrar) — el texto original de la decisión 7 asumía ambas cosas, ninguna se construyó.

### Post-Fase-D: emparejamiento de actividades reales (no es ninguna de las 10 decisiones)
`planned_sessions.actual_activity_id` existía en el esquema desde el principio pero nunca se rellenaba — hecho, ahora sí. Cuando una `activities` sincronizada por `mi-entrenador-garmin` coincide por fecha+tipo con una sesión `planned`/`degraded` (quality/z2↔cycling, strength↔strength), se marca `done` y se enlaza sola, sin pedir confirmación (mismo espíritu que la decisión 4; "Deshacer" es la red de seguridad si el emparejamiento fuera erróneo). Nunca toca sesiones `skipped` ni `planned_tss`. Lógica pura en `lib/activity-matching.ts: findMatchingActivity`, acción en `app/dashboard/activity-matching-actions.ts: ensureActivityMatchesAction`.

### Post-Fase-D: sesiones de fuerza en el panel del día
`strength_sessions` existía en el esquema pero no se mostraba en ningún sitio — hecho, solo lectura, en el panel de detalle del día (`components/dashboard/PlannedSessionActions.tsx`). Cuando una sesión `strength` está `done`/`skipped` y tiene `actual_activity_id` enlazado, el panel hace join por `activity_id` contra `strength_sessions` (`lib/strength-sessions.ts: getStrengthSessionsForWeek`, mismo patrón que `getActivitiesForWeek`) y lista cada ejercicio (`series×reps @ peso`). **Recorte deliberado, confirmado con el usuario**: no hay vista de historial de fuerza aparte — solo este panel puntual. No se toca la escritura de `strength_sessions` (sigue viniendo de fuera de esta app) ni `activity_id` se rellena aquí — si nunca se enlazó desde el origen, el panel simplemente no muestra nada.

### Post-Fase-D: biblioteca de plantillas `workouts`
`workouts` existía en el esquema desde el principio (`workout_template_id` en `planned_sessions` la referencia) pero nunca se había usado — hecho, solo CRUD (crear/ver/editar/borrar) en `/workouts` (`app/workouts/`, `components/workouts/`, `lib/workouts.ts`), enlazado desde el dashboard junto a "Cambiar objetivo". **Recorte deliberado, confirmado con el usuario**: `workout_template_id` no se rellena desde ningún sitio todavía — ni el generador del plan ni el envío a Garmin usan estas plantillas; `mi-entrenador-garmin/api/workout_builder.py` sigue sintetizando el contenido al vuelo. Enlazarlas de verdad es trabajo futuro separado.

Esquema `intervals` (jsonb, diseño nuevo — no estaba cerrado en ningún sitio): array plano y ordenado de pasos, sin grupos anidados (`lib/types.ts: WorkoutStep` — `kind: "warmup"|"interval"|"recovery"|"cooldown"`, `duration_seconds`, `target_low_pct_ftp`, `target_high_pct_ftp`); una repetición de intervalos se expresa como entradas literales repetidas. Solo cubre `quality`/`z2` (`workouts.type`, texto libre en la DB, tratado como `WorkoutType` en la app) — `strength`/`rest` no tienen plantilla. `workouts.ftp_ref` se deja sin usar (null).

**Gap de RLS encontrado y corregido**: `workouts` usaba el patrón antiguo de políticas separadas (insert/select/delete) pero le faltaba la de `update` — editar una plantilla habría afectado 0 filas en silencio. Migración `supabase/migrations/20260901202218_workouts_update_policy.sql` añade solo esa política, sin tocar las otras 3 ni migrar a un único `ALL` como `seasons`/`activities`.

**Importante — orden de los efectos del dashboard**: `WeeklyGenerationEffect`/`DailyAdaptationEffect` (dos componentes separados) se sustituyeron por un único `components/dashboard/DashboardSyncEffect.tsx` que hace `await` de las tres acciones EN SECUENCIA (cierre semanal → emparejar actividades → capa adaptativa), no en paralelo. Correrlas en paralelo es una condición de carrera real: la capa adaptativa podría degradar una sesión justo cuando el emparejamiento está a punto de marcarla `done` porque ya se hizo de verdad. Si se añade una cuarta pieza automática al montar el dashboard, hay que decidir su posición en esa secuencia con el mismo cuidado, no añadirla como un efecto paralelo más.

Supuestos de diseño tomados por no estar cerrados arriba (documentados como constantes, fáciles de ajustar): fórmula de TSS semanal objetivo (`lib/plan-generator.ts: hours_per_week * 55`), número de días de calidad por semana según `goal_type`/`focus_areas`, la ventana de reaclimatación fija en 4 días Z1-Z2 + 1 ramp test, las zonas/duraciones sintéticas de los workouts enviados a Garmin (`mi-entrenador-garmin/api/workout_builder.py`), y la reducción del 25% de TSS al degradar una sesión de precaución (`lib/daily-adaptation.ts`).

**Las 10 decisiones de arquitectura están todas implementadas.** Lo que queda pendiente es todo lo que ninguna de las 10 decisiones cerró explícitamente (no se debe inventar sin preguntar):
- Reglas fisiológicas más allá de la única que existe (nunca intensidad el día siguiente a `strength`) en la decisión 3/posponer.
- La decisión mecánica de progresión de bloque ("sube/repite/inserta") que la decisión 7 asume pero nunca se definió.
- Detección de patrones recurrentes entre varias semanas (decisión 7, ejemplo no implementado).
- Enlazar la biblioteca de `workouts` de verdad: `workout_template_id` sigue siempre `null` en la práctica (nada lo rellena) aunque el CRUD ya existe; el generador del plan y el envío a Garmin siguen sin conocer las plantillas — el envío sintetiza el contenido al vuelo desde `session_type`/`planned_tss`.

**Nota sobre despliegue**: los dos repos (`mi-entrenador-web`, `mi-entrenador-garmin`) están en el mismo equipo de Vercel (`entrenamiento-garmin`) pero como proyectos separados. La identidad de git local debe ser `daramiro4 <daramiro4@gmail.com>` (ya configurada globalmente) — con otra identidad, Vercel bloquea silenciosamente los deploys disparados por push a GitHub (se quedan en estado `UNKNOWN` sin error visible en `git push`).

## Tests
Vitest (único setup de testing documentado para esta versión de Next.js —
ver `node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md`, no hay
guía de Jest). Cobertura por ahora: solo la lógica pura de `lib/*.ts` que
lleva casi todo el riesgo real de negocio del proyecto (motor de plan,
posponer/redistribuir, capa adaptativa, progreso, emparejamiento de
actividades, prompt de la narrativa, calculadora de FTP) — cada `lib/X.ts`
con lógica no trivial tiene su `lib/X.test.ts` al lado. Deliberadamente
**sin cubrir todavía**: las funciones de `lib/*.ts` que hablan con Supabase
(necesitarían mockear el cliente), los Server Actions, y los componentes
React.

- `npm test` — Vitest en modo watch.
- `npx vitest run` — una sola pasada (lo que usa CI).
- `npm run typecheck` — `next typegen && tsc --noEmit`. **Usar este script,
  no `tsc --noEmit` a secas**: sin los tipos que Next genera en `.next/types`
  (`LayoutProps`, etc.), `tsc` falla en un checkout limpio aunque funcione en
  local si ya corriste `next dev` antes — así se rompió el primer intento de
  CI de esta pieza.
- `.github/workflows/ci.yml` corre typecheck + lint + tests en cada push/PR a
  `main`. Es informativo — no bloquea el deploy de Vercel, que se dispara
  aparte por el webhook del push.
