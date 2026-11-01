import type { Contraindication, Equipment, FormatSlug, Mode, Pattern } from "./types";

export interface SetResult {
  reps: number;
  weight_kg: number | null;
  rpe: number | null;
}

export interface BlockExercise {
  slug: string;
  name: string;
  pattern: Pattern;
  mode: Mode;
  sets: number;
  /** reps por serie (modo reps) */
  reps?: number;
  /** Escalones de repeticiones (pirámide); si existe, sets = rep_scheme.length. */
  rep_scheme?: number[];
  /** segundos por serie (modo time) */
  seconds?: number;
  /** Peso objetivo (null = peso corporal / banda / a elegir en la primera sesión). */
  weight_kg: number | null;
  rest_s: number;
  /** Texto de progresión ("Sube 2 kg", "Mantén") para mostrar al usuario. */
  note?: string;
  /** Rellenado al terminar (entreno en vivo). */
  result?: { sets: SetResult[] };
}

export interface WorkoutBlock {
  kind: "warmup" | "main" | "cooldown";
  title: string;
  /** Rondas del bloque (circuito/EMOM/contrarreloj). */
  rounds?: number;
  /** Límite de tiempo (AMRAP) en minutos. */
  cap_min?: number;
  /** Descanso entre rondas en segundos (circuito/contrarreloj). */
  round_rest_s?: number;
  exercises: BlockExercise[];
}

export type Intensity = "suave" | "moderada" | "intensa";

export interface GeneratedWorkout {
  name: string;
  format: FormatSlug;
  duration_min: number;
  requested_min: number;
  intensity: Intensity;
  blocks: WorkoutBlock[];
}

export interface Prefs {
  days_per_week: number;
  session_minutes: number;
  equipment: Equipment[];
  level: 1 | 2 | 3;
  limitations: Contraindication[];
  excluded_areas: Contraindication[];
}

/** Resultado de la última sesión comparable de un ejercicio. */
export interface HistoryEntry {
  slug: string;
  weight_kg: number | null;
  /** Reps objetivo de esa sesión. */
  target_reps: number | null;
  /** Reps realizadas por serie. */
  reps_done: number[];
  rpe: number | null;
  felt: "easy" | "ok" | "hard" | null;
  discomfort: boolean;
}

export interface GenerateInput {
  prefs: Prefs;
  format: FormatSlug;
  history: HistoryEntry[];
  /** Zonas con molestia reciente. */
  recentDiscomfort: Contraindication[];
  /** Slugs usados en las últimas sesiones (rotación). */
  recentSlugs: string[];
  recentNames: string[];
  /** ¿Mañana hay bici de calidad? (undefined = sin datos: no se aplica la regla) */
  nextDayQuality?: boolean;
  seed: number;
}

export interface GenerateResult {
  workout: GeneratedWorkout | null;
  attempts: Array<{ attempt: number; errors: string[] }>;
}
