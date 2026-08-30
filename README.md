# Mi Entrenador — Web

Frontend (Next.js 16 + Supabase Auth) del sistema de entrenador personal de ciclismo.
Es el punto de entrada del sistema: login, cuestionario de onboarding y dashboard.
Comparte base de datos con el bot ([mi-entrenador-garmin](https://github.com/daramiro4/mi-entrenador-garmin)) vía Supabase, pero es un repositorio y despliegue independientes.

## Stack

- Next.js 16 (App Router, Turbopack)
- Supabase Auth (magic link) + `@supabase/ssr`
- Tailwind CSS v4 (tokens de diseño en `app/globals.css`)
- TypeScript, tipos de base de datos generados en `lib/supabase/database.types.ts`

## Desarrollo local

```bash
npm install
npm run dev
```

Necesitas un `.env.local` con:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

Ver `.env.local.example`.

## Estructura

- `app/` — rutas (login, onboarding, dashboard, callback de auth)
- `components/` — UI, agrupada por dominio (`ui`, `fatigue-ring`, `onboarding`, `dashboard`)
- `lib/` — clientes de Supabase, acceso a datos (`seasons.ts`, `metrics.ts`) y lógica pura (`ftp-calculator.ts`)
- `proxy.ts` — guarda de autenticación (equivalente a `middleware.ts` en Next.js 16)

## Alcance de esta fase

Login, onboarding condicional (cuestionario de temporada) y dashboard inicial con el anillo de fatiga.
El motor de generación del plan de entrenamiento y la integración con Telegram son fases posteriores.
