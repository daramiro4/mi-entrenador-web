import { EXERCISE_BY_SLUG } from "./library";
import { MINIMAL_LOAD_TSS } from "./tss";
import type { BlockExercise, GeneratedWorkout } from "./workout-types";

/**
 * Antídoto de conducción: rutina FIJA (sin IA) de ~6 min de movilidad y activación
 * para contrarrestar horas sentado. Se registra como actividad de carga mínima.
 */
/** Nombre con el que se guarda la rutina; sirve para distinguirla de las rutinas de fuerza. */
export const ANTIDOTE_NAME = "Antídoto de conducción";

export const DRIVING_ANTIDOTE_STEPS: Array<{ slug: string; seconds: number }> = [
  { slug: "gato-camello", seconds: 60 },
  { slug: "flexor-cadera", seconds: 60 },
  { slug: "rotacion-toracica", seconds: 60 },
  { slug: "estiramiento-pectoral", seconds: 60 },
  { slug: "retraccion-cervical", seconds: 45 },
  { slug: "puente-gluteo", seconds: 45 },
];

export function drivingAntidote(): GeneratedWorkout & { tss: number } {
  const exercises: BlockExercise[] = DRIVING_ANTIDOTE_STEPS.map((s) => {
    const ex = EXERCISE_BY_SLUG[s.slug];
    return { slug: ex.slug, name: ex.name_es, pattern: ex.pattern, mode: "time", sets: 1, seconds: s.seconds, weight_kg: null, rest_s: 5 };
  });
  const total = exercises.reduce((a, e) => a + (e.seconds ?? 0) + e.rest_s, 0);
  return {
    name: ANTIDOTE_NAME,
    format: "circuito",
    duration_min: Math.round(total / 60),
    requested_min: 6,
    intensity: "suave",
    blocks: [{ kind: "main", title: "Movilidad y activación", exercises }],
    tss: MINIMAL_LOAD_TSS,
  };
}
