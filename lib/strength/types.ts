export type Pattern = "hinge" | "squat" | "push" | "pull" | "core" | "carry" | "mobility";
export type Equipment = "bodyweight" | "dumbbell" | "barbell" | "machine" | "cable" | "band" | "kettlebell";
export type LegLoad = "none" | "light" | "heavy";
export type Contraindication = "low_back" | "knee" | "shoulder" | "neck" | "wrist" | "hip" | "elbow";
export type Mode = "reps" | "time";
export type FormatSlug = "circuito" | "amrap" | "emom" | "contrarreloj" | "piramide";

export type Point = [number, number];
export type GlyphKind = "dumbbell" | "barbell" | "band" | "kettlebell" | "none";

/** Postura resuelta: puntos articulares dentro del viewBox 140×170. */
export interface Pose {
  label: string;
  head: Point;
  shoulder: Point;
  elbow: Point;
  wrist: Point;
  hip: Point;
  knee: Point;
  ankle: Point;
  equipment: { kind: GlyphKind; at: Point; anchor?: Point };
}

export interface Exercise {
  slug: string;
  name_es: string;
  pattern: Pattern;
  equipment: Equipment[];
  level: 1 | 2 | 3;
  leg_load: LegLoad;
  contraindications: Contraindication[];
  alternatives: string[];
  cues_es: string[];
  common_error_es: string;
  garmin_category: string;
  garmin_exercise: string;
  unilateral: boolean;
  mode: Mode;
  /** Etiquetas de las dos posturas ("Arriba"/"Abajo" o "Inicio"/"Final"). */
  pose_labels: [string, string];
  pose_a: Pose;
  pose_b: Pose;
}
