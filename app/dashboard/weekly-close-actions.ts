"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveSeason } from "@/lib/seasons";
import { getPlannedSessionsForWeek } from "@/lib/planned-sessions";
import { generateAndSaveWeeklyPlan } from "@/lib/weekly-plan";
import { getWeeklyNarrativeForWeek, insertWeeklyNarrative } from "@/lib/weekly-narratives";
import { buildWeeklyNarrativePrompt, generateWeeklyNarrativeText } from "@/lib/narrative";
import { addDays, getMondayOfWeek, todayISODate } from "@/lib/week";

/**
 * Decisión 1 — "cierre semanal" simplificado: si la semana que contiene hoy
 * no tiene ninguna sesión generada todavía, se genera ahora. Se dispara al
 * montar el dashboard (ver components/dashboard/WeeklyGenerationEffect.tsx),
 * igual que la capa diaria adaptativa — nunca escribe durante el render del
 * Server Component. Cubre tanto la semana 1 (por si el trigger de onboarding
 * fallara) como cualquier semana siguiente, sin distinguir casos: siempre es
 * "asegura que la semana de hoy exista", nunca genera más de una semana de
 * golpe. También es el punto donde se genera la narrativa de la semana que
 * acaba de cerrar (decisión 7), justo antes de crear la semana nueva.
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

  // La semana de hoy no existe todavía -> la anterior acaba de "cerrar".
  // Genera su narrativa (decisión 7) antes de crear la semana nueva. Nunca
  // bloquea el resto si Gemini falla — mismo principio de resiliencia que
  // ya usa mi-entrenador-garmin/main.py.
  try {
    const previousWeekStart = addDays(weekStartDate, -7);
    const [previousWeekSessions, existingNarrative] = await Promise.all([
      getPlannedSessionsForWeek(supabase, user.id, previousWeekStart),
      getWeeklyNarrativeForWeek(supabase, user.id, previousWeekStart),
    ]);

    if (previousWeekSessions.length > 0 && !existingNarrative) {
      const prompt = buildWeeklyNarrativePrompt(previousWeekSessions, previousWeekStart);
      const narrative = await generateWeeklyNarrativeText(prompt);
      await insertWeeklyNarrative(supabase, user.id, season.id, previousWeekStart, narrative);
    }
  } catch (narrativeError) {
    console.error("No se pudo generar la narrativa semanal:", narrativeError);
  }

  await generateAndSaveWeeklyPlan(supabase, user.id, season, weekStartDate);
  revalidatePath("/dashboard");
}
