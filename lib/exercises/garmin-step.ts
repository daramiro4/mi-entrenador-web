import type { Dose } from "./catalog";

/**
 * Paso de fuerza para el JSON de entreno de Garmin Connect, a partir de un ejercicio del catálogo y una dosis.
 * FUNCIÓN PURA, sin red. Formato idéntico al de `garminconnect` (v0.3.20: `create_strength_exercise_step` /
 * `create_strength_timed_step`) y al que ya envía lib/strength/garmin-map.ts:
 *  - strength_training es el deporte 5 (lo fija el workout, no el paso).
 *  - El paso es de tipo "interval" (id 3) sin objetivo ("no.target", id 1).
 *  - Condición de fin: reps = id 10, time = id 2 (cada una con su propio id, ambas `displayable`).
 *  - `category` debe ser una categoría válida (Garmin responde 400 si no lo es) y `exerciseName` solo se conserva si
 *    coincide con una clave suya; por eso ambos vienen del catálogo oficial importado, nunca de texto libre.
 *  - El peso viaja en GRAMOS con la unidad "kilogram" (id 8, factor 1000).
 * Para comprobar contra la versión del bot: scripts/validate-garmin-keys.ts.
 */

export interface GarminStrengthStep {
  type: "ExecutableStepDTO";
  stepOrder: number;
  stepType: { stepTypeId: 3; stepTypeKey: "interval"; displayOrder: 3 };
  endCondition: { conditionTypeId: 10 | 2; conditionTypeKey: "reps" | "time"; displayOrder: 10 | 2; displayable: true };
  endConditionValue: number;
  targetType: { workoutTargetTypeId: 1; workoutTargetTypeKey: "no.target"; displayOrder: 1 };
  category: string;
  exerciseName: string;
  description?: string;
  weightValue?: number;
  weightUnit?: { unitId: 8; unitKey: "kilogram"; factor: 1000 };
}

export interface StepExercise {
  garmin_category: string;
  garmin_name: string;
}

export interface StepOptions {
  stepOrder: number;
  weight_kg?: number | null;
  description?: string | null;
}

export class GarminStepError extends Error {}

const KEY = /^[A-Z0-9_]+$/;
export const MAX_REPS = 999;
export const MAX_SECONDS = 3600;
export const MAX_DESCRIPTION = 80;

export function buildGarminStrengthStep(exercise: StepExercise, dose: Dose, options: StepOptions): GarminStrengthStep {
  if (!KEY.test(exercise.garmin_category)) throw new GarminStepError(`Categoría de Garmin inválida: "${exercise.garmin_category}"`);
  if (!KEY.test(exercise.garmin_name)) throw new GarminStepError(`Ejercicio de Garmin inválido: "${exercise.garmin_name}"`);
  if (!Number.isInteger(options.stepOrder) || options.stepOrder < 1) throw new GarminStepError("stepOrder debe ser un entero >= 1");

  const isTime = dose.type === "time";
  const value = dose.type === "time" ? dose.seconds : dose.reps;
  const max = isTime ? MAX_SECONDS : MAX_REPS;
  if (!Number.isInteger(value) || value < 1 || value > max) {
    throw new GarminStepError(`${isTime ? "Segundos" : "Repeticiones"} fuera de rango (1-${max}): ${value}`);
  }

  const step: GarminStrengthStep = {
    type: "ExecutableStepDTO",
    stepOrder: options.stepOrder,
    stepType: { stepTypeId: 3, stepTypeKey: "interval", displayOrder: 3 },
    endCondition: isTime
      ? { conditionTypeId: 2, conditionTypeKey: "time", displayOrder: 2, displayable: true }
      : { conditionTypeId: 10, conditionTypeKey: "reps", displayOrder: 10, displayable: true },
    endConditionValue: value,
    targetType: { workoutTargetTypeId: 1, workoutTargetTypeKey: "no.target", displayOrder: 1 },
    category: exercise.garmin_category,
    exerciseName: exercise.garmin_name,
  };
  if (options.description) step.description = options.description.slice(0, MAX_DESCRIPTION);
  const kg = options.weight_kg;
  if (kg != null) {
    if (!Number.isFinite(kg) || kg < 0 || kg > 1000) throw new GarminStepError(`Peso fuera de rango (0-1000 kg): ${kg}`);
    if (kg > 0) {
      step.weightValue = Math.round(kg * 1000);
      step.weightUnit = { unitId: 8, unitKey: "kilogram", factor: 1000 };
    }
  }
  return step;
}
