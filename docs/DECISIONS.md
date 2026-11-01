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
