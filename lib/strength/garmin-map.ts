import { EXERCISE_BY_SLUG } from "./library";
import { FORMAT_BY_SLUG } from "./formats";
import { VALIDATION } from "./validator";
import { GARMIN_OVERRIDES } from "./garmin-overrides";
import type { FormatSlug } from "./types";
import type { BlockExercise, GeneratedWorkout, WorkoutBlock } from "./workout-types";

/**
 * Traducción de una rutina de fuerza al JSON de entreno de Garmin Connect (Forerunner).
 * Formato idéntico al que produce `garminconnect.workout.StrengthWorkout.to_dict()` (v0.3.20):
 * ejercicios = ExecutableStepDTO con `category` + `exerciseName` del catálogo de Garmin;
 * series/rondas = RepeatGroupDTO; descansos = paso `rest` por tiempo.
 *
 * Qué se puede y qué no (ver docs/GARMIN.md):
 *  - circuito / contrarreloj: grupo de repetición por rondas ✔
 *  - fuerza completa: un grupo de repetición por ejercicio (N series + descanso), el bloque nativo de Garmin ✔
 *  - pirámide: pasos planos, uno por escalón (las repeticiones cambian) ✔
 *  - EMOM: pasos por TIEMPO de 60 s (el reloj no sabe "reps al inicio del minuto"); las reps van en la descripción ✔ parcial
 *  - AMRAP: el reloj no tiene "hasta el tiempo límite": se manda un grupo con rondas estimadas
 *    y el límite en la descripción ✔ parcial
 */

const SPORT = { sportTypeId: 5, sportTypeKey: "strength_training", displayOrder: 5 } as const;
const STEP = { interval: { stepTypeId: 3, stepTypeKey: "interval", displayOrder: 3 }, rest: { stepTypeId: 5, stepTypeKey: "rest", displayOrder: 5 }, repeat: { stepTypeId: 6, stepTypeKey: "repeat", displayOrder: 6 } } as const;
const END_REPS = { conditionTypeId: 10, conditionTypeKey: "reps", displayOrder: 10, displayable: true } as const;
const END_TIME = { conditionTypeId: 2, conditionTypeKey: "time", displayOrder: 2, displayable: true } as const;
const END_ITER = { conditionTypeId: 7, conditionTypeKey: "iterations", displayOrder: 7, displayable: false } as const;
const NO_TARGET = { workoutTargetTypeId: 1, workoutTargetTypeKey: "no.target", displayOrder: 1 } as const;
const KG = { unitId: 8, unitKey: "kilogram", factor: 1000 } as const;

export interface GarminStep {
  type: "ExecutableStepDTO" | "RepeatGroupDTO";
  stepOrder: number;
  [k: string]: unknown;
}

export interface GarminWorkoutPayload {
  workoutName: string;
  sportType: typeof SPORT;
  estimatedDurationInSecs: number;
  workoutSegments: Array<{ segmentOrder: number; sportType: typeof SPORT; workoutSteps: GarminStep[] }>;
  author: Record<string, never>;
  description?: string;
}

export interface GarminBuildResult {
  payload: GarminWorkoutPayload;
  /** Ejercicios sin pareja en el catálogo de Garmin (enviados como paso genérico). */
  unmapped: string[];
  /** Limitaciones de la traducción que el usuario debería conocer. */
  notes: string[];
}

class Counter {
  n = 0;
  next() { return ++this.n; }
}

function exerciseStep(order: Counter, e: BlockExercise, mode: { reps?: number; seconds?: number }, desc: string, unmapped: string[]): GarminStep {
  const ex = EXERCISE_BY_SLUG[e.slug];
  const garmin = GARMIN_OVERRIDES[e.slug] ?? (ex?.garmin_category ? ([ex.garmin_category, ex.garmin_exercise] as const) : null);
  const mapped = !!garmin;
  if (!mapped) unmapped.push(e.name);
  const step: GarminStep = {
    type: "ExecutableStepDTO",
    stepOrder: order.next(),
    stepType: STEP.interval,
    endCondition: mode.seconds != null ? END_TIME : END_REPS,
    endConditionValue: mode.seconds ?? mode.reps ?? 10,
    targetType: NO_TARGET,
    // Paso genérico si no está en el catálogo: la categoría "TOTAL_BODY" y el nombre en la descripción.
    category: garmin ? garmin[0] : "TOTAL_BODY",
    exerciseName: garmin ? garmin[1] : "",
    description: desc.slice(0, 80),
  };
  if (e.weight_kg != null && e.weight_kg > 0) {
    step.weightValue = e.weight_kg * 1000; // Garmin guarda gramos con unidad "kilogram"
    step.weightUnit = KG;
  }
  return step;
}

function restStep(order: Counter, seconds: number): GarminStep {
  return { type: "ExecutableStepDTO", stepOrder: order.next(), stepType: STEP.rest, endCondition: END_TIME, endConditionValue: seconds, targetType: NO_TARGET };
}

function repeatGroup(order: Counter, iterations: number, build: () => GarminStep[]): GarminStep {
  const stepOrder = order.next();
  return {
    type: "RepeatGroupDTO", stepOrder, stepType: STEP.repeat, numberOfIterations: iterations,
    workoutSteps: build(), endCondition: END_ITER, endConditionValue: iterations, smartRepeat: false,
  };
}

function blockSteps(format: FormatSlug, b: WorkoutBlock, order: Counter, unmapped: string[], notes: string[]): GarminStep[] {
  const exs = b.exercises;
  const lineSteps = (e: BlockExercise, o: Counter, repsOverride?: number, asMinute = false): GarminStep[] => {
    const timed = e.mode === "time";
    const reps = repsOverride ?? e.reps ?? 10;
    const desc = asMinute ? `${e.name}: ${timed ? `${e.seconds ?? 40} s` : `${reps} reps`} al inicio del minuto` : e.name;
    const step = exerciseStep(o, e, asMinute ? { seconds: 60 } : timed ? { seconds: e.seconds ?? 40 } : { reps }, desc, unmapped);
    return !asMinute && e.rest_s > 0 ? [step, restStep(o, e.rest_s)] : [step];
  };

  if (b.kind !== "main") {
    // Calentamiento: pasos por tiempo, planos.
    return exs.flatMap((e) => lineSteps(e, order));
  }
  if (format === "completa") {
    // Bloque nativo "N series" del editor de Garmin: un grupo de repetición por ejercicio con
    // [ejercicio, descanso] (igual que `create_strength_set` de garminconnect). El reloj muestra "Serie 2 de 3".
    return exs.map((e) => repeatGroup(order, Math.max(1, e.sets), () => lineSteps(e, order)));
  }
  if (format === "piramide") {
    return exs.flatMap((e) =>
      e.rep_scheme ? e.rep_scheme.flatMap((r) => lineSteps({ ...e, mode: "reps" }, order, r)) : lineSteps(e, order)
    );
  }
  if (format === "emom") {
    notes.push("EMOM: cada minuto es un paso de 60 s; las repeticiones van en la descripción (el reloj no puede iniciar 'reps al empezar el minuto').");
    return [repeatGroup(order, b.rounds ?? 1, () => exs.flatMap((e) => lineSteps(e, order, undefined, true)))];
  }
  if (format === "amrap") {
    notes.push(`AMRAP: el reloj no admite 'hasta el tiempo límite'. Se envían ${VALIDATION.AMRAP_ASSUMED_ROUNDS} rondas; el límite (${b.cap_min} min) va en la descripción. Termina cuando suene tu cronómetro.`);
    return [repeatGroup(order, VALIDATION.AMRAP_ASSUMED_ROUNDS, () => exs.flatMap((e) => lineSteps(e, order)))];
  }
  // circuito / contrarreloj
  return [repeatGroup(order, b.rounds ?? 1, () => {
    const steps = exs.flatMap((e) => lineSteps(e, order));
    if ((b.round_rest_s ?? 0) > 0) steps.push(restStep(order, b.round_rest_s!));
    return steps;
  })];
}

export function buildGarminWorkout(w: Pick<GeneratedWorkout, "name" | "format" | "blocks" | "duration_min"> & { guidance?: string | null }): GarminBuildResult {
  const order = new Counter();
  const unmapped: string[] = [];
  const notes: string[] = [];
  const steps = w.blocks.flatMap((b) => blockSteps(w.format, b, order, unmapped, notes));
  const main = w.blocks.find((b) => b.kind === "main");
  const description = [
    `${FORMAT_BY_SLUG[w.format].name_es}${main?.cap_min ? ` · límite ${main.cap_min} min` : ""}${main?.rounds ? ` · ${main.rounds} rondas` : ""}`,
    w.guidance ?? "",
  ].filter(Boolean).join(" — ").slice(0, 500);
  if (unmapped.length) notes.push(`Sin pareja en el catálogo de Garmin (paso genérico): ${unmapped.join(", ")}.`);
  return {
    payload: {
      workoutName: w.name.slice(0, 40),
      sportType: SPORT,
      estimatedDurationInSecs: w.duration_min * 60,
      workoutSegments: [{ segmentOrder: 1, sportType: SPORT, workoutSteps: steps }],
      author: {},
      description,
    },
    unmapped,
    notes,
  };
}

/** Cuenta pasos ejecutables (recursivo), útil para la vista previa. */
export function countSteps(steps: GarminStep[]): number {
  return steps.reduce((a, s) => a + (s.type === "RepeatGroupDTO" ? countSteps(s.workoutSteps as GarminStep[]) : 1), 0);
}
