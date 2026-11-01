import { EXERCISE_BY_SLUG } from "./library";
import type { BlockExercise, GeneratedWorkout } from "./workout-types";

export interface Step {
  kind: "work" | "rest";
  /** Clave estable del ejercicio dentro de la rutina: `${bloque}:${ejercicio}`. */
  key: string;
  blockIdx: number;
  exIdx: number;
  /** Serie (1-based) dentro del ejercicio / ronda. */
  setNo: number;
  setsTotal: number;
  round: number;
  roundsTotal: number;
  reps?: number;
  seconds?: number;
  rest_s?: number;
}

/**
 * Aplana una rutina en la secuencia de pasos del entreno en vivo.
 * circuito/contrarreloj/EMOM: por rondas; pirámide: por ejercicio y escalón;
 * AMRAP: rondas repetidas hasta el límite de tiempo (con holgura).
 */
export function buildSteps(w: Pick<GeneratedWorkout, "format" | "blocks">): Step[] {
  const steps: Step[] = [];
  w.blocks.forEach((b, bi) => {
    const exs = b.exercises;
    const push = (e: BlockExercise, ei: number, round: number, roundsTotal: number, setNo: number, setsTotal: number, reps?: number) => {
      steps.push({
        kind: "work", key: `${bi}:${ei}`, blockIdx: bi, exIdx: ei, setNo, setsTotal, round, roundsTotal,
        reps: e.mode === "time" ? undefined : (reps ?? e.reps ?? 10),
        seconds: e.mode === "time" ? (e.seconds ?? 40) : undefined,
        rest_s: e.rest_s,
      });
      if (e.rest_s > 0) steps.push({ ...steps[steps.length - 1], kind: "rest" });
    };
    if (b.kind === "main" && w.format === "piramide") {
      exs.forEach((e, ei) => {
        const scheme = e.rep_scheme ?? Array.from({ length: e.sets }, () => e.reps ?? 10);
        scheme.forEach((r, si) => push(e, ei, 1, 1, si + 1, scheme.length, r));
      });
    } else {
      const rounds =
        b.kind !== "main" ? 1 : w.format === "amrap" ? Math.max(3, Math.ceil(((b.cap_min ?? 15) * 60) / Math.max(60, exs.length * 45)) + 1) : (b.rounds ?? 1);
      for (let r = 1; r <= rounds; r++) {
        exs.forEach((e, ei) => push(e, ei, r, rounds, r, rounds));
        if (b.kind === "main" && (b.round_rest_s ?? 0) > 0 && r < rounds) {
          const last = steps[steps.length - 1];
          // el descanso entre rondas sustituye al de la última serie de la ronda
          if (last.kind === "rest") last.rest_s = b.round_rest_s;
          else steps.push({ ...last, kind: "rest", rest_s: b.round_rest_s });
        }
      }
    }
  });
  // sin descanso final
  while (steps.length && steps[steps.length - 1].kind === "rest") steps.pop();
  return steps;
}

/** Ejercicio efectivo tras sustituciones (slug original → alternativa). */
export function effectiveSlug(slug: string, swaps: Record<string, string>): string {
  return swaps[slug] ?? slug;
}

/** Paso de carga al pulsar − / +. */
export function weightStep(slug: string): number {
  const eq = EXERCISE_BY_SLUG[slug]?.equipment ?? [];
  return eq.includes("barbell") || eq.includes("machine") || eq.includes("cable") ? 2.5 : 1;
}

export interface SetLog { reps: number; weight_kg: number | null }

/** Vuelca los registros del entreno en `result` de cada ejercicio de la rutina. */
export function applyResults(
  blocks: GeneratedWorkout["blocks"],
  done: Record<string, SetLog[]>,
  swaps: Record<string, string>
): GeneratedWorkout["blocks"] {
  return blocks.map((b, bi) => ({
    ...b,
    exercises: b.exercises.map((e, ei) => {
      const logs = done[`${bi}:${ei}`];
      const swapped = swaps[e.slug];
      const base = swapped ? { ...e, slug: swapped, name: EXERCISE_BY_SLUG[swapped]?.name_es ?? e.name } : e;
      return logs && logs.length ? { ...base, result: { sets: logs.map((l) => ({ reps: l.reps, weight_kg: l.weight_kg, rpe: null })) } } : base;
    }),
  }));
}
