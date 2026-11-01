import type {
  FocusArea,
  GoalType,
  PlannedSessionStatus,
  SessionType,
  WorkoutStepKind,
  WorkoutType,
} from "./types";

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

export const PLANNED_SESSION_STATUS_LABEL: Record<PlannedSessionStatus, string> = {
  planned: "Planificada",
  done: "Hecho",
  skipped: "Saltada",
  postponed: "Pospuesta",
  degraded: "Degradada",
};

export const WORKOUT_TYPE_LABEL: Record<WorkoutType, string> = {
  quality: "Calidad",
  z2: "Z2",
};

export const WORKOUT_STEP_KIND_LABEL: Record<WorkoutStepKind, string> = {
  warmup: "Calentamiento",
  interval: "Intervalo",
  recovery: "Recuperación",
  cooldown: "Enfriamiento",
};

const ACTIVITY_TYPE_LABEL: Record<string, string> = {
  cycling: "Ciclismo",
  strength: "Fuerza",
  running: "Running",
  other: "Otro",
};

/** Mismo idioma visual que SESSION_TYPE_CIRCLE_CLASS (círculo de WeeklyStrip) — para el badge del feed de actividades. */
const ACTIVITY_TYPE_CIRCLE_CLASS: Record<string, string> = {
  cycling: "bg-volt/15 border-volt text-volt",
  strength: "bg-fog/15 border-fog text-paper",
  running: "bg-ember/15 border-ember text-ember",
  other: "border-fog/25 text-fog",
};

/** `activities.activity_type` es texto libre en la base — fallback para valores desconocidos. */
export function getActivityTypeLabel(type: string): string {
  return ACTIVITY_TYPE_LABEL[type] ?? "Otro";
}

export function getActivityTypeCircleClass(type: string): string {
  return ACTIVITY_TYPE_CIRCLE_CLASS[type] ?? ACTIVITY_TYPE_CIRCLE_CLASS.other;
}

const FTP_METHOD_LABEL: Record<string, string> = {
  ramp_test: "Ramp test",
  "20min_test": "Test 20 min",
  estimated: "Estimado",
  manual: "Manual",
};

const FTP_METHOD_COLOR_CLASS: Record<string, string> = {
  ramp_test: "text-ember border-ember",
  "20min_test": "text-volt border-volt",
  estimated: "text-fog border-fog",
  manual: "text-paper border-paper",
};

/** `ftp_history.method` es texto libre y nullable en la base — fallback para null/desconocido. */
export function getFtpMethodLabel(method: string | null): string {
  if (method == null) return "Otro";
  return FTP_METHOD_LABEL[method] ?? "Otro";
}

export function getFtpMethodColorClass(method: string | null): string {
  if (method == null) return "text-fog border-fog";
  return FTP_METHOD_COLOR_CLASS[method] ?? "text-fog border-fog";
}
