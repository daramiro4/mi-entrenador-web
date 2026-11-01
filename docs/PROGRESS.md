# PROGRESS

## 2026-11-01 — Reconocimiento del repo (resumen)
1. Next.js 16.3 (App Router, `proxy.ts` en vez de middleware), React 19, Tailwind v4 (`@theme` en CSS, sin tailwind.config), Supabase SSR.
2. Auth magic link; `proxy.ts` redirige a /login salvo `/login` y `/auth/*`.
3. Queries a Supabase en `lib/*.ts` con cliente tipado (`lib/supabase/database.types.ts`); páginas son Server Components y acciones en `app/**/actions.ts`.
4. Tablas existentes: profiles, seasons, daily_metrics, activities, strength_sessions, ftp_history, fatigue_index, workouts, planned_sessions, weekly_narratives.
5. `planned_sessions` YA existe (migración 20260831…), no hay que crearla.
6. `strength_sessions` es plana (exercise, sets, reps, weight_kg, activity_id) y la rellena el bot de Garmin desde fuera.
7. Motor de plan de ciclismo ya implementado (`lib/plan-generator.ts`), con adaptación diaria, redistribución y narrativa Gemini (`lib/narrative.ts`, modelo gemini-3.6-flash).
8. Envío a Garmin de bici ya funciona en producción vía servicio Python en el repo `mi-entrenador-garmin` (no en este repo).
9. Tests: Vitest sobre lógica pura de `lib/`; CI en GitHub Actions (typecheck+lint+tests).
10. Identidad previa: Asphalt/Ember/Volt, Barlow Condensed + IBM Plex — sustituida por "Garmin by Apple" (ver DECISIONS D2).
11. Dashboard previo: una columna estrecha (max-w-2xl) con muchas tarjetas planas.
12. Hay trabajo previo de David sin commitear (gráficas recharts, ActivityFeed…) — ver DECISIONS D1.
13. `supabase/migrations/00000000000000_initial_schema.sql` está vacío (0 bytes) y sin trackear: se ignora.
14. No existe tabla de ejercicios ni de entrenos de fuerza generados: se crean en Fase 3.
15. Sin Playwright instalado de serie: las capturas dependerán de si se puede instalar (ver Fase 10).

## 2026-11-01 — Fase 1 (cimientos)
Hecho: tokens (`app/tokens.css`), tema Tailwind con alias de nombres antiguos, Inter, manchas de fondo, GlassCard/Tile/Button/Chip/SegmentedNav/TabBar/Ring/ProgressBar/Sparkline/EmptyState/AppShell, claro/oscuro, fallback sin backdrop-filter y reduced-motion. Probar: `/ui` (requiere sesión).

## 2026-11-01 — Fase 2 (Dashboard Hoy)
Hecho: saludo, Tu estado (anillo + baldosas), Sesión de hoy, Esta semana (titular, racha, barra TSS, tira con texto de estado, redistribución), Progreso (existente restilizado), Totales y logros, narrativa. Lógica pura en `lib/dashboard-stats.ts` con tests. Probar: `/dashboard`. Pendiente: sparkline SVG propio de FTP (se mantiene la gráfica recharts previa; ver DECISIONS D5).

## 2026-11-01 — Fase 3 (datos de fuerza) + núcleo de Fase 4
Hecho: migraciones aditivas (`supabase/migrations/20261101100000/100100/100200`), seed idempotente de 40 ejercicios + 5 formatos, tipos TS, comprobaciones RLS (`supabase/rls_checks.sql`, validadas en Postgres local). Biblioteca en `lib/strength/` con poses por cinemática directa y tests geométricos (viewBox, longitudes ±10 %, snapshot). Pendiente de aplicar en Supabase real (ver D9).

## 2026-11-01 — Fase 4 (viñetas)
Hecho: `components/strength/PoseFigure.tsx` (PoseFigure, PosePair, PoseLoop con bucle de ~3,2 s solo opacity y reduced-motion), `ExerciseCard` (claves, error común, alternativas, cómo se envía al reloj), poses de los 40 ejercicios, galería `/ui/poses`. Revisión visual con contact sheet renderizada en Chrome headless: legibles; los ejercicios unilaterales dibujan una sola pierna (ver D10).
