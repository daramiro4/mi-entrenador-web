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

export interface SeasonNotes {
  event_type?: string;
  free_text?: string;
  weight_goal_capped?: boolean;
  [key: string]: unknown;
}

export interface PlannedSessionNotes {
  kind?: "ramp_test";
  reacclimatization_discount_pct?: number;
  effective_ftp_watts?: number;
  /** Presente cuando saltar esta sesión movió su TSS a otra — bloquea "deshacer". */
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
