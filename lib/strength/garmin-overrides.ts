/**
 * Correcciones del emparejamiento con el catálogo de Garmin Connect (garminconnect 0.3.20, 1527 ejercicios).
 *
 * `library.ts` guarda el emparejamiento original, que además está sembrado en la base (migración
 * 20261102202859_seed_strength_library.sql, ya aplicada: no se reescribe). Estas entradas lo sustituyen
 * solo al construir el entreno para el reloj. Todas se validan con `scripts/validate_garmin_mapping.py`.
 */
export const GARMIN_OVERRIDES: Record<string, readonly [category: string, exercise: string]> = {
  // Antes: Kettlebell Floor to Shelf (otro movimiento).
  "peso-muerto-kettlebell": ["DEADLIFT", "KETTLEBELL_DEADLIFT"],
  // Antes: Dumbbell Single-leg Deadlift to Row (añadía un remo).
  "peso-muerto-una-pierna": ["DEADLIFT", "SINGLE_LEG_ROMANIAN_DEADLIFT_WITH_DUMBBELL"],
  // Antes: Seated Cable Row (polea; aquí es banda elástica).
  "remo-banda": ["BANDED_EXERCISES", "ROW"],
};
