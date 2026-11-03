export const MIN_PASSWORD_LENGTH = 8;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

/** Devuelve un mensaje en español o null si el formulario de acceso es válido. */
export function validateLogin(email: string, password: string): string | null {
  if (!email.trim()) return "Escribe tu email.";
  if (!isValidEmail(email)) return "El email no parece válido.";
  if (!password) return "Escribe tu contraseña.";
  return null;
}

/** Devuelve un mensaje en español o null si la nueva contraseña y su confirmación son válidas. */
export function validateNewPassword(password: string, confirm: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }
  if (password !== confirm) return "Las contraseñas no coinciden.";
  return null;
}

/** Traduce los errores habituales de Supabase Auth a mensajes claros en español. */
export function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Email o contraseña incorrectos.";
  if (m.includes("email not confirmed")) return "Tu email aún no está confirmado.";
  if (m.includes("rate limit") || m.includes("too many")) {
    return "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.";
  }
  if (m.includes("same password") || m.includes("different from the old")) {
    return "La nueva contraseña debe ser distinta de la actual.";
  }
  if (m.includes("weak") || m.includes("password should")) {
    return "La contraseña es demasiado débil. Usa al menos 8 caracteres.";
  }
  if (m.includes("signups not allowed") || m.includes("user not found")) {
    return "No existe ninguna cuenta con ese email.";
  }
  if (m.includes("failed to fetch") || m.includes("network")) {
    return "No hay conexión. Revisa tu red e inténtalo de nuevo.";
  }
  if (m.includes("session") && m.includes("missing")) {
    return "El enlace ha caducado. Pide uno nuevo desde «He olvidado la contraseña».";
  }
  return "No se ha podido completar la operación. Inténtalo de nuevo.";
}

/** Solo rutas internas: evita redirecciones abiertas vía ?next=. */
export function safeNextPath(next: string | null | undefined, fallback = "/"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  return next;
}
