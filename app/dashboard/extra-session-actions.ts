"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLatestFatigueIndex } from "@/lib/metrics";
import { getPlannedSessionsForWeek } from "@/lib/planned-sessions";
import { addDays, getMondayOfWeek, todayISODate } from "@/lib/week";
import {
  EXTRA_SESSION_VARIANTS,
  suggestExtraSession,
  type ExtraSessionSuggestion,
  type ExtraSessionVariant,
} from "@/lib/extra-session";
import {
  previewExtraSessionForGarmin,
  sendExtraSessionToGarmin,
  type GarminWorkoutPreview,
  type SendToGarminResult,
} from "@/lib/garmin";

export type SuggestExtraSessionResult =
  | { ok: true; suggestion: ExtraSessionSuggestion; preview: GarminWorkoutPreview | null }
  | { ok: false; error: string };

/**
 * "¿Hago bici extra?": sugiere una sesión voluntaria por pulso según la
 * fatiga (lib/extra-session.ts) y trae su vista previa. No escribe nada en
 * Supabase — la sesión extra no forma parte del plan.
 */
export async function suggestExtraSessionAction(): Promise<SuggestExtraSessionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const today = todayISODate();
  const tomorrow = addDays(today, 1);
  const weekStart = getMondayOfWeek(today);
  const tomorrowWeekStart = getMondayOfWeek(tomorrow);

  const [latestFatigue, weekSessions, tomorrowWeekSessions] = await Promise.all([
    getLatestFatigueIndex(supabase, user.id),
    getPlannedSessionsForWeek(supabase, user.id, weekStart),
    tomorrowWeekStart === weekStart
      ? Promise.resolve(null)
      : getPlannedSessionsForWeek(supabase, user.id, tomorrowWeekStart),
  ]);

  const tomorrowSession =
    (tomorrowWeekSessions ?? weekSessions).find((s) => s.date === tomorrow) ?? null;

  const suggestion = suggestExtraSession({ latestFatigue, weekSessions, tomorrowSession, today });

  if (suggestion.type === "none") {
    return { ok: true, suggestion, preview: null };
  }

  const preview = await previewExtraSessionForGarmin(suggestion.variant, today);
  if (!preview.ok || !preview.preview) {
    return { ok: false, error: preview.error ?? "No se pudo generar la vista previa." };
  }

  return { ok: true, suggestion, preview: preview.preview };
}

export async function sendExtraSessionAction(
  variant: ExtraSessionVariant
): Promise<SendToGarminResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!EXTRA_SESSION_VARIANTS.includes(variant)) {
    return { ok: false, error: "Variante de sesión extra no válida." };
  }

  return sendExtraSessionToGarmin(variant, todayISODate());
}
