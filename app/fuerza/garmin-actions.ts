"use server";

import { createClient } from "@/lib/supabase/server";
import { sendStrengthWorkoutToGarmin, type GarminSendOutcome } from "@/lib/strength/garmin-send";

/** Vista previa (dry-run) o envío real al Forerunner de una rutina de fuerza. */
export async function sendToForerunnerAction(
  workoutId: string,
  opts: { dryRun: boolean; date?: string }
): Promise<GarminSendOutcome> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado", status: 401 };
  return sendStrengthWorkoutToGarmin(supabase, user.id, workoutId, opts);
}
