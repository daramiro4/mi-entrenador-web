# Acceso (auth)

- **Principal**: email + contraseña (`signInWithPassword`) en `/login`.
- **Secundario**: enlace mágico por email (`signInWithOtp` con `shouldCreateUser: false`: solo cuentas que ya existen).
- **Contraseña**: se cambia en `/ajustes` (`updateUser({ password })`, mínimo 8 caracteres + confirmación).
- **Olvidada**: `resetPasswordForEmail` → enlace → `/auth/callback?next=/auth/reset` → `/auth/reset` fija la nueva.
- Las contraseñas las gestiona Supabase Auth; la app nunca las guarda ni las muestra.
- El enlace de correo (magic link y reset) usa PKCE: **hay que abrirlo en el mismo navegador donde se pidió** y solo vale una vez.

## Redirect URLs a autorizar (Supabase → Authentication → URL Configuration)

Site URL: `https://mi-entrenador-web.vercel.app`

Redirect URLs:
- `https://mi-entrenador-web.vercel.app/auth/callback`
- `https://mi-entrenador-web-*-entrenamiento-garmin.vercel.app/auth/callback` (previews de Vercel; el comodín `*` no cruza `/`)
- `http://localhost:3000/auth/callback` (desarrollo)

Entrar con contraseña NO usa redirect URLs: funciona igual en producción y en cualquier preview. Solo hacen falta para el enlace mágico y el reset.

## Cerrar el registro público

Supabase → Authentication → Sign In / Providers → desactivar **Allow new users to sign up**. Hacerlo solo después de confirmar que se entra con contraseña. Con el registro cerrado el enlace mágico solo funciona para cuentas existentes (el código ya lo pide con `shouldCreateUser: false`).
