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

export interface SeasonNotes {
  event_type?: string;
  free_text?: string;
  weight_goal_capped?: boolean;
  [key: string]: unknown;
}

export type Profile = Tables<"profiles">;
export type FtpHistoryRow = Tables<"ftp_history">;
export type DailyMetricsRow = Tables<"daily_metrics">;
export type FatigueIndexRow = Tables<"fatigue_index">;

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
