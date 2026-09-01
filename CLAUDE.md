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
- Disparo de la **primera semana**: se genera una sola vez dentro de `submitOnboarding` (`app/onboarding/actions.ts`), justo tras crear la temporada. Es el único trigger que existe — no hay generación automática en el dashboard ni botón manual todavía (evita mutar datos en el render de un Server Component; ver `node_modules/next/dist/docs/01-app/02-guides/server-actions.md`).
- `WeeklyStrip` (`components/dashboard/WeeklyStrip.tsx`) ya pinta los 7 días con datos reales de `planned_sessions`; si la temporada no tiene sesiones generadas (p. ej. temporadas creadas antes de esta pieza), sigue mostrando el placeholder "Aún no hay sesiones planificadas."
- **Decisión 10 (envío manual a Garmin)**: hecho y verificado en producción contra una cuenta real. Botón "Enviar a Garmin" en `WeeklyStrip` (solo en sesiones `quality`/`z2`) → `app/dashboard/garmin-actions.ts` → servicio Python separado en el repo `mi-entrenador-garmin` (`api/send_workout.py`, función Vercel independiente del cron diario, mismo login nativo de `garminconnect`). `api/workout_builder.py` sintetiza el workout (bloque Z2 continuo, o calentamiento+intervalos+enfriamiento para calidad) a partir de `session_type`/`planned_tss`/FTP — no existe todavía una biblioteca de `workouts` real, así que esto es una traducción sintética, documentada como ajustable. Auth entre los dos repos vía secreto compartido (`GARMIN_SEND_SERVICE_URL`/`GARMIN_SEND_SECRET`, configurados en Vercel de ambos proyectos, no en el código).

Supuestos de diseño tomados por no estar cerrados arriba (documentados como constantes en `lib/plan-generator.ts` y `mi-entrenador-garmin/api/workout_builder.py`, fáciles de ajustar): fórmula de TSS semanal objetivo (`hours_per_week * 55`), número de días de calidad por semana según `goal_type`/`focus_areas`, la ventana de reaclimatación fija en 4 días Z1-Z2 + 1 ramp test, y las zonas/duraciones sintéticas de los workouts enviados a Garmin.

Aún NO existe:
- El evento de "cierre semanal" que genera la semana siguiente (decisión 1) — hoy solo se genera la semana 1 en el onboarding.
- La capa diaria adaptativa (decisión 4) y la redistribución de TSS perdido (decisión 3).
- Marcar hecho/saltar/posponer en la UI (decisión 9) — `WeeklyStrip` es de solo lectura salvo el botón de Garmin.
- La narrativa semanal vía IA (decisión 7) y la señal de progreso entre tests de FTP (decisión 8) — ambas dependen de que exista el cierre semanal.
- El anillo de fatiga con el lenguaje simplificado (decisión 6) — hoy solo muestra el dato técnico.

**Nota sobre despliegue**: los dos repos (`mi-entrenador-web`, `mi-entrenador-garmin`) están en el mismo equipo de Vercel (`entrenamiento-garmin`) pero como proyectos separados. La identidad de git local debe ser `daramiro4 <daramiro4@gmail.com>` (ya configurada globalmente) — con otra identidad, Vercel bloquea silenciosamente los deploys disparados por push a GitHub (se quedan en estado `UNKNOWN` sin error visible en `git push`).
