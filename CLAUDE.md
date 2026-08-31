# Mi Entrenador — Contexto del proyecto (mi-entrenador-web)

## Qué es esto
Webapp de entrenador personal de ciclismo. Next.js + Supabase Auth + Tailwind, desplegado en Vercel (plan Hobby). Multi-usuario desde el diseño, aunque de uso personal por ahora.

## Stack y despliegue
- Next.js + Tailwind + Supabase Auth (magic link)
- Producción: https://mi-entrenador-web.vercel.app
- Proyecto Supabase: `exqohgqxcnzevaneqnmc`, región `eu-west-1`

## Esquema de Supabase relevante
- `profiles`, `seasons`, `daily_metrics`, `activities`, `strength_sessions`, `ftp_history`, `fatigue_index`, `workouts` ya existen.
- `planned_sessions` es NUEVA (definida en diseño, aún sin crear en Supabase): `id`, `user_id`, `season_id`, `date`, `workout_template_id` (FK a `workouts`, nullable), `session_type` (quality/z2/strength/rest), `planned_tss`, `status` (planned/done/skipped/postponed/degraded), `actual_activity_id` (FK a `activities`, nullable), `notes` (jsonb).
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
El modelo deportivo está completamente diseñado y las decisiones de arquitectura arriba están cerradas. Aún NO existe:
- La tabla `planned_sessions` en Supabase
- Ningún código del motor de generación de plan
- La UI del dashboard para el plan semanal (tira semanal, marcar hecho/saltar/posponer)
- El anillo de fatiga con el lenguaje simplificado (hoy solo muestra el dato técnico)
