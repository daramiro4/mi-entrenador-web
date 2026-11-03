# DECISIONS

Formato: decisión · alternativas · motivo · cómo revertirla.

## D1 — Árbol de trabajo con cambios previos sin commitear
Al empezar, `main` tenía trabajo ajeno sin commitear (gráficas recharts, ActivityFeed, DailyHealthCard, etc.). La rama se crea desde ese estado; **cada commit incluye solo los archivos que toco yo**. Los archivos previos sin commitear que el dashboard importa se quedan sin commitear (David decide). Alternativa: commitearlos también (descartado: no son míos). Revertir: nada que revertir.

## D2 — Alias de tokens antiguos en vez de reescribir todos los componentes
Identidad nueva en `app/tokens.css` (único archivo editable de tonos). Los nombres Tailwind antiguos (`ember`, `paper`, `fog`, `steel`, `asphalt`, `volt`, `fatiga`) quedan como **alias** de los tokens nuevos en `app/globals.css` (`@theme inline`), y `.data-surface` = cristal. Así los componentes previos (WeeklyStrip, formularios, etc.) adoptan la identidad nueva sin tocarlos; los nuevos usan `accent`, `label`, `label-2`… Alternativa: reescribir ~30 componentes (más riesgo). Revertir: restaurar `globals.css`/`layout.tsx`/`Button.tsx` desde `main`.

## D3 — package.json
`lucide-react` añadido (iconos pedidos por el brief, ligero, tree-shakeable). `package.json`/`package-lock.json` ya tenían cambios previos de David (recharts); se commitean juntos porque no se pueden separar sin romper el lockfile.

## D4 — Navegación
Hoy/Plan/Progreso son anclas (`/dashboard`, `#plan`, `#progreso`) del mismo dashboard; Fuerza es ruta propia. El estado activo en el dashboard es siempre "Hoy" (sin scroll-spy) por simplicidad.

## D5 — Gráficas de progreso
El brief pide sparkline SVG propio para FTP y "Forma" 4 semanas. David ya tenía `FtpProgressionChart`/`FitnessTrendChart` (recharts) sin commitear; se mantienen restilizadas por los alias de tokens en vez de duplicarlas. `Sparkline` propio existe y está disponible. Revertir/sustituir: cambiar el import en `app/dashboard/page.tsx`.

## D6 — "Enviar a Garmin" bici
El brief lo pide deshabilitado ("Próximamente"), pero en este repo ya funciona en producción (decisión 10 de CLAUDE.md). No se retrocede: se conserva el botón funcional.

## D7 — Racha
`STREAK_MIN_PCT = 85` en `lib/dashboard-stats.ts`. Semana = TSS de `activities` (lun–dom) ≥ 85 % del `planned_tss` de esa semana; una semana sin plan corta la racha; la semana en curso solo suma si ya está cumplida. Provisional.

## D8 — Nombre de usuario
`profiles.name` puede ser null: el saludo omite el nombre.

## D1 (corrección)
Como `app/dashboard/page.tsx` importa los archivos previos sin commitear (ActivityFeed, DailyHealthCard, FitnessTrendChart, FtpProgressionChart, `lib/metrics.ts`, `lib/labels.ts`, etc.), la rama no compilaría sin ellos: se commitean con la Fase 2 (sin cambios de contenido por mi parte, salvo el restilizado). Se excluyen `supabase/.temp/` y la migración vacía `00000000000000_initial_schema.sql`.

## D9 — Migraciones: escritas y validadas, NO aplicadas a producción
Hay un único proyecto Supabase (producción). Las migraciones de fuerza (`20261102202722_…`, `…100100_…`, `…100200_seed_…`) son aditivas, con rollback comentado, y se validaron aplicándolas dos veces (idempotencia) sobre un Postgres de prueba (imagen supabase/postgres en Docker) con stubs de las tablas previas, más `supabase/rls_checks.sql` (aislamiento entre usuarios, lectura de biblioteca solo autenticados, `garmin_tokens` sin políticas). Los tipos de `database.types.ts` se editaron a mano para esas tablas (regenerar con `supabase gen types` tras aplicar). **David debe aplicarlas** (`supabase db push`) antes de usar /fuerza contra datos reales; mientras tanto la app degrada con estados vacíos si las tablas no existen (no lanza).
`planned_sessions` ya existía: no se creó.

## D10 — Biblioteca en código + siembra generada; poses esquemáticas
La biblioteca (40 ejercicios) vive en `lib/strength/library.ts` (el motor de reglas y la UI no dependen de la BD para leerla) y la tabla `exercises` se siembra desde ahí (`npm run seed:strength`; un test falla si el SQL versionado se desincroniza). Las poses se generan por cinemática directa (`lib/strength/poses.ts`: longitudes de segmento constantes, ángulos por postura, encaje conjunto en el viewBox 140×170), no a mano punto a punto como en el ejemplo del brief: garantiza longitudes estables entre posturas (test ≤10 %). **Son esquemáticas** (p. ej. en ejercicios unilaterales solo se dibuja una pierna) y están listas para sustituirse por arte definitivo editando `pose_a/pose_b`. Los nombres `garmin_category/garmin_exercise` son los del catálogo FIT recordados de memoria y **no están verificados**: los contrasta `scripts/validate_garmin_mapping.py` (Fase 9).

## D11 — Motor de reglas (Fase 5)
- Determinista con semilla (`lib/strength/engine.ts`); constantes en `ENGINE`/`VALIDATION`/`REP_RANGE`/`STRENGTH_TSS`. Estructura: calentamiento (2-3 movilidad, 40 s) + bloque principal de 4-7 ejercicios en orden de prioridad bisagra→tirón→empuje→core→sentadilla→tirón→acarreo (garantiza tirón ≥ empuje y bisagra+core siempre). Elige el nº de ejercicios y rondas que mejor encajan en la duración pedida (±15 %).
- **Empuje:tirón**: interpretado como "al menos tanto tirón como empuje". Si el equipamiento no ofrece ningún tirón, tampoco se programa empuje (se añadió `remo-invertido`, de peso corporal, para que casi siempre haya tirón).
- **Cargas**: el motor nunca inventa un peso inicial; sin historial el peso es `null` ("elige un peso con el que sobren 2-3 reps") y la doble progresión actúa desde la 2ª sesión. Subida ≤ 10 % (también lo comprueba el validador).
- **Formatos**: circuito/contrarreloj ajustan rondas; EMOM ajusta rondas (1 ejercicio por minuto); AMRAP ajusta el límite de tiempo (10-40 min); pirámide elige entre [6,8,10,8,6] y [8,6] según la duración. Las duraciones se calculan solo desde el contenido (`estimateMinutes`).
- **Validador**: ejercicios existentes y compatibles con el equipamiento, sin contraindicaciones (limitaciones + zonas excluidas + molestias recientes), tope de 12 series/patrón, calentamiento, duración ±15 %, bisagra y core presentes, sin pierna pesada si mañana hay bici de calidad (solo si `planned_sessions` tiene dato de mañana), carga ≤ +10 %. 3 intentos; el 3º es conservador (4 ejercicios, sesgo a peso corporal). Cada intento registra sus motivos en `strength_workouts.generation_log`.
- **TSS de fuerza**: `IF = 0.4 + 0.04·RPE; TSS = horas·IF²·100` en `lib/strength/tss.ts`. Plan previsto con RPE 6. Integración con el TSS semanal (Fase 7): al terminar una rutina se escribe `strength_tss` en `strength_workouts`, se marca la sesión `strength` del día en `planned_sessions` y se crea (o completa, si el bot ya trajo una actividad de fuerza ese día) una fila en `activities` con `tss`; **pendiente/no tocado**: que el bot de Garmin use ese `tss` en `fatigue_index` (hoy usa `training_load` de Garmin).
- Antídoto de conducción: rutina fija de 6 pasos (~6 min) en `lib/strength/antidote.ts`; carga mínima `MINIMAL_LOAD_TSS = 3`.
- Historial: se deriva de `strength_workouts.blocks[].exercises[].result` de rutinas terminadas (no de `strength_sessions`, que además se escribe serie a serie).

## D12 — UI de fuerza y entreno en vivo (Fases 6-7)
- `/fuerza`: sin `user_strength_prefs` muestra primero el cuestionario; con tablas ausentes (migraciones sin aplicar) muestra un estado vacío explicativo en vez de fallar.
- Zonas con molestia (esfuerzo percibido) pasan a `user_strength_prefs.excluded_areas` **hasta que David las limpie** en "Preferencias y molestias" (el brief lo pide así); además el motor mira molestias de los últimos 14 días.
- Entreno en vivo: pasos aplanados por `buildSteps` (EMOM se simplifica a rondas con descanso, no impone el minuto exacto; AMRAP genera rondas de sobra y se termina a mano al acabar el tiempo). Estado (`step`, series hechas, sustituciones) en `strength_workouts.progress`, guardado tras cada serie; se puede cerrar y reanudar. Cada serie escribe una fila en `strength_sessions` (con `workout_id`, `exercise_slug`, `set_index`).
- Al terminar: RPE de sesión (1-10, por defecto 6) → `strength_tss`; se marca `done` la sesión `strength` planificada del día (si existe) y se escribe en `activities` (`source = 'mi-entrenador-web'`, `external_id = 'sw:<id>'`) o se completa el `tss` de la actividad de fuerza que ya trajo Garmin. `sumTss` del dashboard evita doble conteo si luego llega la de Garmin. El antídoto se registra como `activity_type = 'mobility'` con 3 TSS.
- Cambio de ejercicio: solo entre `alternatives` del propio ejercicio que sean elegibles (equipamiento/nivel/zonas); el peso de la alternativa arranca vacío (no se hereda).

## D13 — Capa IA (Fase 8)
`lib/strength/ai.ts`. Apagada por defecto: solo se usa con `STRENGTH_AI_ENABLED=true` **y** `GEMINI_API_KEY` (no hay clave en este entorno, por lo que no se ha probado contra Gemini real; los tests inyectan un modelo falso). Modelo `gemini-3.6-flash`: es el que ya usa en producción la narrativa semanal (`lib/narrative.ts`, verificada en su día con llamada real según CLAUDE.md); no he podido reverificarlo aquí sin clave. El prompt solo ofrece slugs elegibles y prohíbe cargas; la respuesta se valida por esquema, los slugs deben existir y ser elegibles, el motor pone estructura y cargas, y el validador decide; cualquier fallo → motor de reglas, con el motivo en `generation_log`. La **narrativa semanal** ya existía (decisión 7 de CLAUDE.md, `weekly_narratives`), solo con datos de `planned_sessions`; no se modifica. Revertir: quitar la variable.

## D14 — Servicio Garmin de fuerza (Fase 9)
- **Ubicación**: función Python en el repo web (`api/garmin_strength.py`), no en el bot: no toca el cron diario (límite duro del brief), comparte despliegue y variables con la app y valida la sesión de Supabase directamente. El bot **no se ha modificado**. Alternativa descartada: ampliar `mi-entrenador-garmin/api/send_workout.py` (ya autenticado por secreto compartido) — válida si se prefiere un único servicio Garmin.
- **Mapeo construido en TS, envío en Python**: el JSON se construye y testea en TS (dry-run sin Python) y la función solo autentica, sube y programa; así no hay dos implementaciones del mapeo. Compatibilidad verificada con el modelo `StrengthWorkout` de garminconnect 0.3.20 (los 5 formatos).
- **Catálogo**: los nombres `garmin_*` de mi primera versión eran de memoria y 19 de 41 no existían; se corrigieron contra el catálogo real (`garminconnect.exercises`) y `scripts/validate_garmin_mapping.py` los vigila (41/41).
- **Python 3.12**: garminconnect ≥ 0.3 lo exige; `.python-version` y `requirements.txt` en la raíz. **No he podido probar el despliegue de la función en Vercel** (sin deploy permitido): verificarlo en el preview. Riesgo conocido: que Vercel tome `api/__init__.py` por función (el prefijo `_` debería ignorarlo).
- Interruptor `GARMIN_SEND_ENABLED` (apagado): la UI muestra "Próximamente"; la API `POST /api/fuerza/garmin` sigue sirviendo el dry-run.
- Una cuenta de Garmin por despliegue (variables de entorno); los tokens se cachean por `user_id` de Supabase.


## Fuerza: un solo formato, "Fuerza completa" (2026-11-04)
Pedido del usuario: en vez de circuito/AMRAP/EMOM/contrarreloj/pirámide, una sesión clásica de varios ejercicios con 3 series, cuerpo completo y ejercicios distintos cada día. Perfil: hombre de 40 años, ~100 kg, fuerte, ciclista de carretera, muchas horas en coche.
- `completa` es el único formato que se ofrece (`SELECTABLE_FORMATS`). Los cinco antiguos siguen en el código (leer entrenos ya guardados, recuperarlos si hace falta) pero no se generan.
- 5-7 ejercicios por sesión, 3 series, 8 reps (doble progresión 8-12 ya existente), descanso 60/90/120 s elegido para ajustar la duración. Orden de grupos: bisagra, pierna, tirón, empuje, core, tirón extra, acarreo; tirón ≥ empuje (corrige postura de conducir). Calentamiento con movilidad de cadera y torácica.
- Duración 30-60 min (la de 20 min no cabe con 3 series y todos los grupos). Un valor guardado fuera de rango se lee ajustado, sin reescribir la base.
- Variación entre días: penalización de los ejercicios de las últimas sesiones (mecanismo previo) → rotación A/B/C con 3 días/semana.
- Ejercicios de poco valor como trabajo principal (elevación de talones, curl, buenos días, etc.) solo salen si no hay otra opción del patrón.
- Mismas reglas de seguridad: sin pierna pesada si mañana hay bici de calidad, subida de carga ≤ 10 %.
- La siembra SQL de `workout_formats` (aplicada en remoto) no incluye `completa`: la app no lee esa tabla y la migración aplicada no se reescribe.
