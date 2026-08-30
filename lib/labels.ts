import type { FocusArea, GoalType } from "./types";

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
