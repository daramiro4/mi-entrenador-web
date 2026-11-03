/**
 * Comprobación de las variables públicas de Supabase.
 *
 * Los llamadores pasan `process.env.NEXT_PUBLIC_...` con el nombre literal (Next solo las
 * incorpora al bundle así). Nunca se incluyen los valores en los mensajes, solo los nombres.
 */
export const SUPABASE_URL_VAR = "NEXT_PUBLIC_SUPABASE_URL";
export const SUPABASE_KEY_VAR = "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY";

export function missingSupabaseVars(url: string | undefined, key: string | undefined): string[] {
  const missing: string[] = [];
  if (!url?.trim()) missing.push(SUPABASE_URL_VAR);
  if (!key?.trim()) missing.push(SUPABASE_KEY_VAR);
  return missing;
}

export function supabaseEnvMessage(missing: string[]): string {
  return `Falta configurar ${missing.join(" y ")} en este entorno (Vercel → Settings → Environment Variables; marca el entorno correcto: Production, Preview o Development) y vuelve a desplegar.`;
}

/** Devuelve url y key o lanza un error claro con el nombre de la variable que falta. */
export function requireSupabaseEnv(url: string | undefined, key: string | undefined): { url: string; key: string } {
  const missing = missingSupabaseVars(url, key);
  if (missing.length > 0) throw new Error(supabaseEnvMessage(missing));
  return { url: url as string, key: key as string };
}
