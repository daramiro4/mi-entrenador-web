"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getPlannedSessionById, mergePlannedSessionNotes } from "@/lib/planned-sessions";
import { getFatigueIndexForDate } from "@/lib/metrics";
import { generateWeeklyNarrativeText } from "@/lib/narrative";
import { buildSessionReviewPrompt, validReview, type SessionReview } from "@/lib/session-review";

export interface SessionReviewResult {
  ok: boolean;
  error: string | null;
  review: SessionReview | null;
}

/**
 * Reseña breve de IA (Gemini, mismo cliente que la narrativa semanal) de un entreno hecho con actividad enlazada.
 * Se genera UNA vez y se guarda en `planned_sessions.notes.review`: abrir de nuevo el entreno no vuelve a llamar a la IA.
 * Informativa, como la narrativa: nunca cambia el plan, el estado ni el FTP.
 */
export async function generateSessionReviewAction(plannedSessionId: string): Promise<SessionReviewResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const session = await getPlannedSessionById(supabase, user.id, plannedSessionId);
  if (!session) return { ok: false, error: "No se encontró la sesión.", review: null };

  const existing = validReview(session);
  if (existing) return { ok: true, error: null, review: existing };

  if (session.status !== "done" || session.actual_activity_id == null) {
    return { ok: false, error: "La reseña necesita un entreno hecho con su actividad.", review: null };
  }

  const { data: activity } = await supabase
    .from("activities")
    .select("*")
    .eq("id", session.actual_activity_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!activity) return { ok: false, error: "No se encontró la actividad enlazada.", review: null };

  const [fatigue, exercisesRes] = await Promise.all([
    getFatigueIndexForDate(supabase, user.id, activity.date),
    activity.activity_type === "strength"
      ? supabase.from("strength_sessions").select("*").eq("user_id", user.id).eq("activity_id", activity.id)
      : Promise.resolve({ data: [] }),
  ]);

  try {
    const text = await generateWeeklyNarrativeText(
      buildSessionReviewPrompt(session, activity, {
        fatigueRecommendation: fatigue?.recommendation ?? null,
        exercises: exercisesRes.data ?? [],
      }),
    );
    const review: SessionReview = { text, generated_at: new Date().toISOString(), activity_id: activity.id };
    await mergePlannedSessionNotes(supabase, user.id, session, { review });
    revalidatePath("/dashboard");
    return { ok: true, error: null, review };
  } catch (e) {
    // Detalle solo en el log del servidor: puede incluir el cuerpo de la respuesta de Gemini.
    console.error("[review] no se pudo generar la reseña:", e instanceof Error ? e.message : e);
    return { ok: false, error: "No se pudo generar la reseña ahora mismo.", review: null };
  }
}
