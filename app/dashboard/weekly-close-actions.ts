"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveSeason } from "@/lib/seasons";
import { getPlannedSessionsForWeek } from "@/lib/planned-sessions";
import { generateAndSaveWeeklyPlan } from "@/lib/weekly-plan";
import { getMondayOfWeek, todayISODate } from "@/lib/week";

/**
 * Decisión 1 — "cierre semanal" simplificado: si la semana que contiene hoy
 * no tiene ninguna sesión generada todavía, se genera ahora. Se dispara al
 * montar el dashboard (ver components/dashboard/WeeklyGenerationEffect.tsx),
 * igual que la capa diaria adaptativa — nunca escribe durante el render del
 * Server Component. Cubre tanto la semana 1 (por si el trigger de onboarding
 * fallara) como cualquier semana siguiente, sin distinguir casos: siempre es
 * "asegura que la semana de hoy exista", nunca genera más de una semana de
 * golpe.
 */
export async function ensureCurrentWeekGeneratedAction(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const season = await getActiveSeason(supabase, user.id);
  if (!season) {
    return;
  }

  const weekStartDate = getMondayOfWeek(todayISODate());
  const existing = await getPlannedSessionsForWeek(supabase, user.id, weekStartDate);
  if (existing.length > 0) {
    return;
  }

  await generateAndSaveWeeklyPlan(supabase, user.id, season, weekStartDate);
  revalidatePath("/dashboard");
}
