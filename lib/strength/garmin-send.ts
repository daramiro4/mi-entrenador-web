import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { buildGarminWorkout, countSteps, type GarminWorkoutPayload } from "./garmin-map";
import { getWorkoutById } from "./data";

export type GarminSendOutcome =
  | {
      ok: true;
      dry_run: boolean;
      enabled: boolean;
      payload: GarminWorkoutPayload;
      steps: number;
      notes: string[];
      unmapped: string[];
      garmin_workout_id?: string;
      scheduled_for?: string | null;
    }
  | { ok: false; error: string; status?: number };

/** Interruptor global de envío real. Por defecto APAGADO. */
export function garminSendEnabled(): boolean {
  return process.env.GARMIN_SEND_ENABLED === "true";
}

/** URL del servicio Python (función serverless del repo web, o una URL explícita). */
function serviceUrl(): string | null {
  if (process.env.GARMIN_STRENGTH_SERVICE_URL) return process.env.GARMIN_STRENGTH_SERVICE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}/api/garmin_strength`;
  return null;
}

/**
 * Construye el entreno de Garmin y, si no es dry-run y el interruptor está encendido,
 * lo envía al servicio Python con la sesión de Supabase del usuario.
 */
export async function sendStrengthWorkoutToGarmin(
  supabase: SupabaseClient<Database>,
  userId: string,
  workoutId: string,
  opts: { dryRun: boolean; date?: string }
): Promise<GarminSendOutcome> {
  const w = await getWorkoutById(supabase, userId, workoutId);
  if (!w) return { ok: false, error: "Rutina no encontrada", status: 404 };

  const built = buildGarminWorkout({ name: w.name, format: w.format, blocks: w.blocks, duration_min: w.duration_min, guidance: w.guidance });
  const base = {
    ok: true as const,
    enabled: garminSendEnabled(),
    payload: built.payload,
    steps: countSteps(built.payload.workoutSegments[0].workoutSteps),
    notes: built.notes,
    unmapped: built.unmapped,
  };

  // Dry-run, o interruptor apagado: devuelve lo que se enviaría y NO sale nada a Garmin.
  if (opts.dryRun || !base.enabled) return { ...base, dry_run: true };

  const url = serviceUrl();
  if (!url) return { ok: false, error: "Falta GARMIN_STRENGTH_SERVICE_URL (o VERCEL_URL).", status: 500 };
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return { ok: false, error: "Sesión caducada", status: 401 };

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ workout: built.payload, date: opts.date ?? null }),
      cache: "no-store",
    });
  } catch {
    return { ok: false, error: "No se pudo contactar con el servicio de Garmin.", status: 502 };
  }
  const body = (await res.json().catch(() => ({}))) as { workout_id?: string | number; scheduled_for?: string | null; error?: string };
  if (!res.ok) return { ok: false, error: body.error ?? `El servicio de Garmin respondió ${res.status}`, status: res.status };

  const garminId = body.workout_id != null ? String(body.workout_id) : undefined;
  if (garminId) {
    await supabase.from("strength_workouts").update({ garmin_workout_id: garminId }).eq("id", workoutId).eq("user_id", userId);
  }
  return { ...base, dry_run: false, garmin_workout_id: garminId, scheduled_for: body.scheduled_for ?? null };
}
