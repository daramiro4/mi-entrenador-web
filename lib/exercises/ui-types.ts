import type { Dose } from "./catalog";

/** Fila ligera para la lista de /ejercicios (1.553 filas: solo lo necesario para buscar, filtrar y pintar). */
export interface ExerciseListRow {
  id: string;
  garmin_category: string;
  garmin_name: string;
  name_es: string;
  name_en: string;
  equipment: string[];
  primary_muscles: string[];
  level: 1 | 2 | 3 | null;
  review_status: "draft" | "reviewed";
  archetype: string | null;
}

/** Ficha completa de un ejercicio. */
export interface ExerciseDetail extends ExerciseListRow {
  secondary_muscles: string[];
  dose_default: Dose | null;
  cues: string[];
  common_mistake: string | null;
  /** Claves completas CATEGORÍA/EJERCICIO. */
  alternatives: string[];
  name_es_status: string;
  plan_eligible: boolean;
}

export interface CategoryRow {
  garmin_category: string;
  name_es: string;
  name_en: string;
}

export const rowKey = (r: Pick<ExerciseListRow, "garmin_category" | "garmin_name">): string => `${r.garmin_category}/${r.garmin_name}`;
