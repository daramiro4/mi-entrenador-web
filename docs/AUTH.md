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
- `https://mi-entrenador-*-entrenamiento-garmin.vercel.app/auth/callback` (previews de Vercel; el proyecto en Vercel se llama `mi-entrenador`)
- `http://localhost:3000/auth/callback` (desarrollo)

Entrar con contraseña NO usa redirect URLs: funciona igual en producción y en cualquier preview. Solo hacen falta para el enlace mágico y el reset.

## Cerrar el registro público

Supabase → Authentication → Sign In / Providers → desactivar **Allow new users to sign up**. Hacerlo solo después de confirmar que se entra con contraseña. Con el registro cerrado el enlace mágico solo funciona para cuentas existentes (el código ya lo pide con `shouldCreateUser: false`).

## Previews de Vercel

Los previews están detrás de Vercel Authentication: para abrirlos hay que haber iniciado sesión en Vercel en ese navegador (en el móvil también). Es independiente del login de la app.

## Primera contraseña (cuenta que aún no tiene)

Supabase → Authentication → Users solo ofrece *Send password recovery* y *Send magic link*; no permite escribir una contraseña a mano. Orden recomendado:

1. Añade las Redirect URLs de arriba (sin ellas el enlace de correo no vuelve a la app).
2. En `/login` del preview o de producción pulsa **Entrar con un enlace por email**, pide el enlace y ábrelo **en el mismo navegador**.
3. Dentro, el dashboard muestra el aviso «Aún no tienes contraseña»; ve a **/ajustes** y fíjala. (La app anota `has_password` en `user_metadata` para dejar de avisar.)
4. Alternativa equivalente: *Send password recovery* en Users → abre el enlace en el navegador → `/auth/reset`.

### Último recurso: fijarla por SQL

Solo si lo anterior falla. En el SQL Editor de Supabase:

```sql
update auth.users
set encrypted_password = crypt('LA_CONTRASEÑA', gen_salt('bf')),
    updated_at = now()
where email = 'TU_EMAIL';
```

**Aviso:** la contraseña en claro queda en el historial del SQL Editor (y en cualquier log o portapapeles que pase). Cámbiala después desde `/ajustes` para que deje de valer la que quedó escrita. Este SQL lo ejecutas tú; la app y Claude no lo ejecutan.
