import "server-only";
import { readFileSync } from "node:fs";
import type { Catalog } from "./catalog";
import type { CategoryRow, ExerciseDetail, ExerciseListRow } from "./ui-types";
import { rowKey } from "./ui-types";

/**
 * Catálogo leído de data/garmin-exercises.json (el que genera la migración). SOLO para las páginas de ejemplo de desarrollo
 * (/ui/preview/ejercicios): permiten ver y probar la interfaz antes de que exista la tabla nueva en la base de datos.
 * Las páginas reales (/ejercicios) leen la base de datos.
 */
export function loadStaticCatalog(): { rows: ExerciseListRow[]; categories: CategoryRow[]; details: Record<string, ExerciseDetail> } {
  const catalog = JSON.parse(readFileSync("data/garmin-exercises.json", "utf8")) as Catalog;
  const details: Record<string, ExerciseDetail> = {};
  const rows = catalog.exercises.map((e) => {
    const detail: ExerciseDetail = {
      id: `${e.garmin_category}/${e.garmin_name}`,
      garmin_category: e.garmin_category,
      garmin_name: e.garmin_name,
      name_es: e.name_es,
      name_en: e.name_en,
      equipment: e.equipment,
      primary_muscles: e.primary_muscles,
      level: e.level,
      review_status: e.review_status,
      archetype: e.archetype,
      secondary_muscles: e.secondary_muscles,
      dose_default: e.dose_default,
      cues: e.cues,
      common_mistake: e.common_mistake,
      alternatives: e.alternatives,
      name_es_status: e.name_es_status,
      plan_eligible: e.plan_eligible,
    };
    details[detail.id] = detail;
    return { ...detail } as ExerciseListRow;
  });
  const categories = catalog.categories.map((c) => ({ garmin_category: c.garmin_category, name_es: c.name_es, name_en: c.name_en }));
  void rowKey;
  return { rows, categories, details };
}
