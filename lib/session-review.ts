import { SESSION_TYPE_LABEL } from "./labels";
import { formatHrZoneMinutes } from "./hr-zones";
import { describeHrAdjustment } from "./hr-adjustment";
import { loadBasedTss, plannedStrengthTssForSession } from "./strength/tss";
import type { ActivityRow, HrZoneSeconds, PlannedSession, StrengthSessionRow } from "./types";

const RECOMMENDATION_PHRASE: Record<string, string> = {
  normal: "recuperado",
  precaucion: "cargado (precaución)",
  descanso: "necesitaba descanso",
};

/** Reseña guardada en `planned_sessions.notes.review`; `activity_id` evita enseñar una reseña de otra actividad si se vuelve a enlazar. */
export interface SessionReview {
  text: string;
  generated_at: string;
  activity_id: number;
}

/** La reseña guardada solo vale si es de la actividad que tiene enlazada ahora la sesión. */
export function validReview(session: Pick<PlannedSession, "notes" | "actual_activity_id">): SessionReview | null {
  const review = session.notes?.review as SessionReview | undefined;
  if (!review || typeof review.text !== "string" || review.activity_id !== session.actual_activity_id) return null;
  return review;
}

export interface ReviewContext {
  fatigueRecommendation: string | null;
  exercises: StrengthSessionRow[];
}

const num = (v: number | string | null | undefined): number | null => {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/**
 * Prompt de la reseña de UN entreno hecho. Solo usa datos que existen (plan, actividad enlazada, fatiga del día,
 * ejercicios de fuerza): lo que falta se omite y se le pide a la IA no inventarlo. Texto breve, sin jerga.
 */
export function buildSessionReviewPrompt(
  session: PlannedSession,
  activity: ActivityRow,
  context: ReviewContext
): string {
  const lines: string[] = [];
  const type = SESSION_TYPE_LABEL[session.session_type];
  lines.push(`- Tipo de sesión planificada: ${type}${session.notes?.kind === "ramp_test" ? " (test de rampa)" : ""}`);
  lines.push(`- Fecha en que se hizo: ${activity.date}`);

  const plannedTss = session.planned_tss ?? plannedStrengthTssForSession({ ...session, status: "planned" });
  if (plannedTss != null) lines.push(`- TSS planificado: ${Math.round(plannedTss)}`);
  if (session.notes?.duration_minutes != null) lines.push(`- Duración planificada: ${session.notes.duration_minutes} min`);

  const done = loadBasedTss(activity);
  if (activity.duration_minutes != null) lines.push(`- Duración real: ${Math.round(Number(activity.duration_minutes))} min`);
  if (done) lines.push(`- TSS real: ${done.estimated ? "≈" : ""}${Math.round(done.tss)}${done.estimated ? " (estimado, sin potenciómetro)" : ""}`);
  const np = num(activity.normalized_power);
  const ap = num(activity.avg_power);
  if (np != null) lines.push(`- Potencia normalizada: ${Math.round(np)} W`);
  else if (ap != null) lines.push(`- Potencia media: ${Math.round(ap)} W`);
  const avgHr = num(activity.avg_hr);
  const maxHr = num(activity.max_hr);
  if (avgHr != null) lines.push(`- FC media: ${Math.round(avgHr)} ppm`);
  if (maxHr != null) lines.push(`- FC máxima: ${Math.round(maxHr)} ppm`);
  if (activity.hr_zone_seconds) {
    const zones = formatHrZoneMinutes(activity.hr_zone_seconds as unknown as HrZoneSeconds);
    if (zones.length > 0) lines.push(`- Minutos por zona de pulso: ${zones.map((z) => `${z.zone} ${z.minutes}`).join(", ")}`);
  }
  if (context.fatigueRecommendation) {
    lines.push(`- Estado de recuperación ese día: ${RECOMMENDATION_PHRASE[context.fatigueRecommendation] ?? context.fatigueRecommendation}`);
  }
  const hrNote = describeHrAdjustment(session.notes?.hr_adjustment);
  if (hrNote) lines.push(`- Aviso del sistema sobre el pulso: ${hrNote}`);
  if (typeof session.notes?.moved_from === "string") {
    lines.push(`- Estaba planificada el ${session.notes.moved_from} y se hizo otro día`);
  }
  if (context.exercises.length > 0) {
    const list = context.exercises
      .map((e) => `${e.exercise}${e.sets != null && e.reps != null ? ` ${e.sets}×${e.reps}` : ""}${e.weight_kg != null ? ` @ ${e.weight_kg} kg` : ""}`)
      .join("; ");
    lines.push(`- Ejercicios: ${list}`);
  }

  return `
Eres un entrenador personal de ciclismo. Haz una reseña MUY breve (máximo 70 palabras, 3 frases) del entreno que acaba de hacer la persona, hablándole directamente, en tono cercano y sin lenguaje técnico.

Datos del entreno:
${lines.join("\n")}

Reglas:
- Di qué salió bien y, si procede, una sola cosa concreta a mejorar o a vigilar (por ejemplo el pulso respecto a los vatios, el cumplimiento del TSS o la recuperación).
- Usa solo los datos de arriba; si falta algo, no lo menciones ni lo inventes. Sin consejos médicos.
- Sin listas ni títulos, solo texto corrido. Termina con un emoji.
`.trim();
}
