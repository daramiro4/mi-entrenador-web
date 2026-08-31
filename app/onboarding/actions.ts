"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { archiveActiveSeason, createSeason } from "@/lib/seasons";
import { generateAndSaveWeeklyPlan } from "@/lib/weekly-plan";
import { getMondayOfWeek, todayISODate } from "@/lib/week";
import type { NewSeasonInput } from "@/lib/types";

export async function submitOnboarding(
  input: NewSeasonInput
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await archiveActiveSeason(supabase, user.id);
  const { data: season, error } = await createSeason(supabase, user.id, input);

  if (error) {
    return { error };
  }

  if (season) {
    try {
      await generateAndSaveWeeklyPlan(
        supabase,
        user.id,
        season,
        getMondayOfWeek(todayISODate())
      );
    } catch (planError) {
      console.error("No se pudo generar la primera semana del plan:", planError);
    }
  }

  redirect("/dashboard");
}
