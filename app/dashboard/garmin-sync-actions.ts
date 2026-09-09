"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { triggerGarminSync, type SyncGarminResult } from "@/lib/garmin-sync";
import { ensureActivityMatchesAction } from "./activity-matching-actions";
import { ensureDailyAdaptationAction } from "./daily-adaptation-actions";

/**
 * Sincronización manual bajo demanda: dispara api/sync_now.py en
 * mi-entrenador-garmin (login a Garmin Connect + descarga de HOY, en vez de
 * esperar al cron diario que solo trae "ayer"). Si trae datos nuevos,
 * re-evalúa el día con las mismas dos acciones que ya usa
 * DashboardSyncEffect al montar el dashboard, EN EL MISMO ORDEN (emparejar
 * actividad real antes de la capa adaptativa, mismo motivo que ahí: evita
 * que la capa adaptativa degrade una sesión que la actividad recién
 * sincronizada ya completó de verdad).
 */
export async function syncFromGarminAction(): Promise<SyncGarminResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const result = await triggerGarminSync();
  if (!result.ok) {
    return result;
  }

  await ensureActivityMatchesAction();
  await ensureDailyAdaptationAction();
  revalidatePath("/dashboard");

  return result;
}
