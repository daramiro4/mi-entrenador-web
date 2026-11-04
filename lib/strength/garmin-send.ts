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

/**
 * Servicio de envío: la función `api/send_strength.py` de mi-entrenador-garmin (el bot), que ya tiene las
 * credenciales de Garmin y el login probado con la cuenta real. Se autentica con el mismo secreto
 * compartido que el envío de bici (GARMIN_SEND_SECRET). La URL sale de GARMIN_STRENGTH_SERVICE_URL si
 * existe, o se deriva de GARMIN_SEND_SERVICE_URL (".../api/send_workout" → ".../api/send_strength").
 */
export function strengthServiceConfig(env: Record<string, string | undefined>): { url: string; secret: string } | null {
  const secret = env.GARMIN_SEND_SECRET?.trim();
  if (!secret) return null;
  const explicit = env.GARMIN_STRENGTH_SERVICE_URL?.trim();
  if (explicit) return { url: explicit, secret };
  const base = env.GARMIN_SEND_SERVICE_URL?.trim();
  if (!base) return null;
  const derived = base.replace(/\/send_workout\/?$/, "/send_strength");
  // Si la URL no acaba en /send_workout no se puede derivar con seguridad: se exige la explícita.
  return derived === base ? null : { url: derived, secret };
}

/** Interpreta la respuesta del servicio (éxito o error) sin lanzar. */
export function parseServiceResponse(
  status: number,
  ok: boolean,
  body: { workout_id?: string | number; scheduled_for?: string | null; error?: string; ok?: boolean }
): { ok: true; garminId?: string; scheduledFor: string | null } | { ok: false; error: string; status: number } {
  if (!ok || body.ok === false) {
    return { ok: false, error: body.error ?? `El servicio de Garmin respondió ${status}`, status: status || 502 };
  }
  return { ok: true, garminId: body.workout_id != null ? String(body.workout_id) : undefined, scheduledFor: body.scheduled_for ?? null };
}

/**
 * Construye el entreno de Garmin y, si no es dry-run y el interruptor está encendido,
 * lo envía al servicio del bot (la acción ya validó la sesión del usuario).
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

  const config = strengthServiceConfig(process.env);
  if (!config) {
    return { ok: false, error: "El servicio de envío a Garmin no está configurado (GARMIN_SEND_SERVICE_URL y GARMIN_SEND_SECRET).", status: 500 };
  }

  let res: Response;
  try {
    res = await fetch(config.url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.secret}` },
      body: JSON.stringify({ workout: built.payload, date: opts.date ?? null }),
      cache: "no-store",
    });
  } catch {
    return { ok: false, error: "No se pudo contactar con el servicio de Garmin.", status: 502 };
  }
  const body = (await res.json().catch(() => ({}))) as Parameters<typeof parseServiceResponse>[2];
  const parsed = parseServiceResponse(res.status, res.ok, body);
  if (!parsed.ok) return parsed;

  const garminId = parsed.garminId;
  if (garminId) {
    await supabase.from("strength_workouts").update({ garmin_workout_id: garminId }).eq("id", workoutId).eq("user_id", userId);
  }
  return { ...base, dry_run: false, garmin_workout_id: garminId, scheduled_for: parsed.scheduledFor };
}
