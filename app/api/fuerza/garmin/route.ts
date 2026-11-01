import { createClient } from "@/lib/supabase/server";
import { sendStrengthWorkoutToGarmin } from "@/lib/strength/garmin-send";

/**
 * API interna: POST /api/fuerza/garmin  { workoutId, dry_run?: boolean (por defecto true), date?: 'YYYY-MM-DD' }
 * dry_run=true devuelve el JSON que se enviaría a Garmin sin enviar nada.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "No autenticado" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { workoutId?: string; dry_run?: boolean; date?: string };
  if (!body.workoutId) return Response.json({ error: "Falta workoutId" }, { status: 400 });
  if (body.date && !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) return Response.json({ error: "Fecha inválida" }, { status: 400 });

  const out = await sendStrengthWorkoutToGarmin(supabase, user.id, body.workoutId, { dryRun: body.dry_run !== false, date: body.date });
  return Response.json(out, { status: out.ok ? 200 : (out.status ?? 500) });
}
