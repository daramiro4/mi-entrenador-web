# Informe final — feat/garmin-apple-fuerza

Commits (en orden): 22e77b3 c541014 340672a 5ad7a5a d0b67c2 a9563a1 230e26f 0147c55 

## Qué se hizo por fase
1. **Cimientos** ✔ tokens, Inter, manchas, componentes base, claro/oscuro, fallback sin backdrop-filter, reduced-motion, `/ui`.
2. **Dashboard Hoy** ✔ saludo, estado, sesión de hoy, semana (racha, barra TSS, tira con texto, redistribución), progreso, totales/insignias, narrativa.
3. **Datos de fuerza** ✔ 3 migraciones aditivas (escritas y validadas en Postgres local; **no aplicadas**), seed idempotente, tipos, RLS probada.
4. **Viñetas** ✔ PoseFigure/PosePair/PoseLoop, 41 ejercicios con poses, tarjeta de ejercicio, tests geométricos.
5. **Generador y validador** ✔ reglas, validador, doble progresión, TSS, antídoto, API interna, ~100 tests.
6. **UI de fuerza** ✔ `/fuerza`, cuestionario, generar/guardar, esfuerzo percibido y molestias.
7. **Entreno en vivo** ✔ persistente/reanudable, series a `strength_sessions`, descansos, cambio de ejercicio, resumen, TSS al plan.
8. **IA opcional** ✔ detrás de `STRENGTH_AI_ENABLED`; sin clave en el entorno → no probada con Gemini real.
9. **Servicio Garmin** ✔ mapeo + dry-run + función Python + validador (41/41) + smoke test + docs; envío real apagado.
10. **Pulido** ✔ Lighthouse móvil (preview con datos de ejemplo): **/ui/preview/hoy rendimiento 100 · accesibilidad 96; /ui/preview/fuerza 100 · 96**. Sin scroll horizontal a 390 px. Capturas claro/oscuro a 1280 y 390 en `docs/screens/` (hoy, fuerza, entreno, biblioteca).

Pendiente: récords de potencia 5/20/60 (fase opcional, fila oculta); sparkline SVG propio de FTP (se mantuvo la gráfica recharts previa); la IA y el envío real a Garmin no se han podido probar con credenciales.

## Cómo probar
- Sin BD: `UI_PREVIEW=1 npm run build && UI_PREVIEW=1 npm start` → `/ui/preview/hoy|fuerza|entreno`, `/ui/poses`.
- Con BD: aplicar migraciones, entrar, abrir `/dashboard` y `/fuerza`. URL de preview de Vercel: **no hay** (no se ha desplegado).

## Decisiones a revisar (por importancia)
1. D9 migraciones sin aplicar · 2. D14 servicio Garmin en el repo web + Python 3.12 en Vercel sin probar · 3. D2 alias de tokens antiguos (identidad nueva) · 4. D11 motor (cargas iniciales vacías, TSS de fuerza no entra aún en la fatiga del bot) · 5. D1 se commitearon los cambios previos sin commitear de David · 6. D12 zonas con molestia excluidas hasta limpiarlas · 7. D13 IA · 8. D5/D6/D7 gráficas, botón Garmin de bici funcional, racha 85 %.

## Migraciones (escritas; revertir con el rollback comentado en cada archivo)
`20261102202722_strength_library` · `20261102202723_strength_user_tables` (incluye `garmin_tokens`) · `20261102202859_seed_strength_library`. Comprobación RLS: `supabase/rls_checks.sql`.

## Qué debe hacer David a mano
- `supabase db push` (o aplicar las 3 migraciones) y regenerar tipos.
- Variables: `GARMIN_SEND_ENABLED`, `GARMIN_EMAIL`, `GARMIN_PASSWORD`, `SUPABASE_SERVICE_ROLE_KEY` (Secret), opcional `GARMIN_STRENGTH_SERVICE_URL`, `STRENGTH_AI_ENABLED` (+ `GEMINI_API_KEY`).
- Prueba real con el Forerunner: `docs/GARMIN.md`. Verificar el deploy de `api/garmin_strength.py` en un preview de Vercel.
- Afinar tonos Garmin en `app/tokens.css`; valores provisionales: `STREAK_MIN_PCT` (85), TSS de fuerza (`lib/strength/tss.ts`), RPE previsto 6.
- Fase D (motor de plan de ciclismo) y E (envío de bici) ya existían en main y no se tocaron; falta que el bot use el TSS de fuerza en `fatigue_index`.
