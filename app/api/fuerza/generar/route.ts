import { createClient } from "@/lib/supabase/server";
import { generateForUser } from "@/lib/strength/service";
import { SELECTABLE_FORMATS } from "@/lib/strength/formats";
import type { FormatSlug } from "@/lib/strength/types";

/**
 * API interna: POST /api/fuerza/generar  { format, save?: boolean }
 * Requiere sesión de Supabase. `save: false` = previsualizar sin guardar.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "No autenticado" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { format?: string; save?: boolean };
  const format = SELECTABLE_FORMATS.find((f) => f.slug === body.format)?.slug as FormatSlug | undefined;
  if (!format) return Response.json({ error: "Formato inválido" }, { status: 400 });

  const outcome = await generateForUser(supabase, user.id, format, { save: body.save !== false });
  if (!outcome.ok) {
    return Response.json(outcome, { status: outcome.reason === "missing_tables" ? 503 : 422 });
  }
  return Response.json(outcome);
}
