import type { FocusArea, GoalType, SessionType } from "./types";

export const GOAL_TYPE_LABEL: Record<GoalType, string> = {
  ftp_improvement: "Mejorar FTP",
  event_prep: "Preparar evento",
  maintenance: "Mantener forma",
};

export const FOCUS_AREA_LABEL: Record<FocusArea, string> = {
  vo2max: "VO2max",
  general_health: "Salud general",
  climbing: "Escalada",
  rouleur: "Rodador",
  weight_loss: "Bajar peso",
};

export const SESSION_TYPE_LABEL: Record<SessionType, string> = {
  quality: "Calidad",
  z2: "Z2",
  strength: "Fuerza",
  rest: "Descanso",
};

/** Clases de borde/fondo/texto para el círculo de cada tipo de sesión en WeeklyStrip. */
export const SESSION_TYPE_CIRCLE_CLASS: Record<SessionType, string> = {
  quality: "bg-ember/15 border-ember text-ember",
  z2: "bg-volt/15 border-volt text-volt",
  strength: "bg-fog/15 border-fog text-paper",
  rest: "border-fog/25 text-fog",
};
