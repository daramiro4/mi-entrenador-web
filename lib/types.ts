import type { Tables } from "./supabase/database.types";

export type GoalType = "ftp_improvement" | "event_prep" | "maintenance";

export type FocusArea =
  | "vo2max"
  | "general_health"
  | "climbing"
  | "rouleur"
  | "weight_loss";

export type SeasonStatus = "active" | "completed" | "archived";

export type FatigueRecommendation = "normal" | "precaucion" | "descanso";

export type SessionType = "quality" | "z2" | "strength" | "rest";

export type PlannedSessionStatus =
  | "planned"
  | "done"
  | "skipped"
  | "postponed"
  | "degraded";

import type { HrAdjustmentRecord } from "./hr-adjustment";

export interface SeasonNotes {
  /** FTP provisional del usuario (p. ej. la estimación de Garmin) hasta que haya un test de rampa (lib/ftp-base.ts). */
  provisional_ftp_watts?: number;
  /** FTP de ciclismo que Garmin Connect tiene registrado; lo escribe el bot en cada sync (api/garmin_ftp.py). */
  garmin_ftp_watts?: number;
  garmin_ftp_date?: string;
  /** Descuento (%) vigente sobre los vatios de Z2 por discrepancia vatios/pulso (lib/hr-adjustment.ts). */
  hr_discount_pct?: number;
  event_type?: string;
  free_text?: string;
  weight_goal_capped?: boolean;
  [key: string]: unknown;
}

export interface PlannedSessionNotes {
  kind?: "ramp_test";
  reacclimatization_discount_pct?: number;
  effective_ftp_watts?: number;
  /** Duración objetivo en minutos para sesiones z2 de reaclimatación (decisión 5) — sin `planned_tss`, así que el envío a Garmin no puede derivar la duración desde el TSS. */
  duration_minutes?: number;
  /** Presente cuando saltar esta sesión movió su TSS a otra — bloquea "deshacer". */
  /** Evaluación por pulso de esta Z2 una vez hecha (lib/hr-adjustment.ts); su presencia evita reevaluar. */
  hr_adjustment?: HrAdjustmentRecord;
  redistributed_to_session_id?: string;
  redistributed_tss?: number;
  [key: string]: unknown;
}

export type Profile = Tables<"profiles">;
export type FtpHistoryRow = Tables<"ftp_history">;
export type DailyMetricsRow = Tables<"daily_metrics">;
export type FatigueIndexRow = Tables<"fatigue_index">;
export type WeeklyNarrative = Tables<"weekly_narratives">;
export type ActivityRow = Tables<"activities">;
export type StrengthSessionRow = Tables<"strength_sessions">;

export interface HrZoneSeconds {
  z1: number;
  z2: number;
  z3: number;
  z4: number;
  z5: number;
}

export type WorkoutStepKind = "warmup" | "interval" | "recovery" | "cooldown";

export interface WorkoutStep {
  kind: WorkoutStepKind;
  duration_seconds: number;
  target_low_pct_ftp: number;
  target_high_pct_ftp: number;
}

export type WorkoutType = "quality" | "z2";

export type Workout = Omit<Tables<"workouts">, "intervals" | "type"> & {
  intervals: WorkoutStep[];
  type: WorkoutType | null;
};

export interface NewWorkoutInput {
  name: string;
  type: WorkoutType;
  notes: string | null;
  intervals: WorkoutStep[];
}

export type Season = Omit<Tables<"seasons">, "goal_type" | "status" | "focus_areas" | "notes"> & {
  goal_type: GoalType;
  status: SeasonStatus;
  focus_areas: FocusArea[] | null;
  notes: SeasonNotes | null;
};

export interface NewSeasonInput {
  name: string;
  goal_type: GoalType;
  target_date: string | null;
  target_ftp: number | null;
  target_weight_kg: number | null;
  focus_areas: FocusArea[];
  hours_per_week: number | null;
  strength_days_per_week: number | null;
  notes: SeasonNotes;
}

export type PlannedSession = Omit<
  Tables<"planned_sessions">,
  "session_type" | "status" | "notes"
> & {
  session_type: SessionType;
  status: PlannedSessionStatus;
  notes: PlannedSessionNotes | null;
};

/** Borrador de una sesión planificada, previo a insertarse en la base de datos. */
export interface PlannedSessionDraft {
  date: string;
  session_type: SessionType;
  planned_tss: number | null;
  notes: PlannedSessionNotes | null;
}
