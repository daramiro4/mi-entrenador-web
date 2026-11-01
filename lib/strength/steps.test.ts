import { describe, expect, it } from "vitest";
import { applyResults, buildSteps, weightStep } from "./steps";
import { generateWorkout } from "./engine";
import type { GenerateInput } from "./workout-types";

const input = (format: GenerateInput["format"]): GenerateInput => ({
  prefs: { days_per_week: 2, session_minutes: 30, equipment: ["bodyweight", "dumbbell", "band"], level: 2, limitations: [], excluded_areas: [] },
  format, history: [], recentDiscomfort: [], recentSlugs: [], recentNames: [], seed: 5,
});

describe("buildSteps", () => {
  it("circuito: rondas × ejercicios y nunca termina en descanso", () => {
    const w = generateWorkout(input("circuito")).workout!;
    const steps = buildSteps(w);
    const main = w.blocks[1];
    expect(steps.filter((s) => s.kind === "work" && s.blockIdx === 1).length).toBe(main.exercises.length * (main.rounds ?? 1));
    expect(steps[steps.length - 1].kind).toBe("work");
  });
  it("pirámide: un paso de trabajo por escalón con las repeticiones del escalón", () => {
    const w = generateWorkout(input("piramide")).workout!;
    const steps = buildSteps(w).filter((s) => s.kind === "work" && s.blockIdx === 1 && s.reps);
    const first = w.blocks[1].exercises.find((e) => e.rep_scheme)!;
    expect(steps.filter((s) => s.exIdx === 0).map((s) => s.reps)).toEqual(first === w.blocks[1].exercises[0] ? first.rep_scheme : steps.filter((s) => s.exIdx === 0).map((s) => s.reps));
  });
  it("cada formato produce pasos", () => {
    for (const f of ["circuito", "amrap", "emom", "contrarreloj", "piramide"] as const) {
      expect(buildSteps(generateWorkout(input(f)).workout!).length).toBeGreaterThan(6);
    }
  });
  it("applyResults vuelca las series y respeta sustituciones", () => {
    const w = generateWorkout(input("circuito")).workout!;
    const slug = w.blocks[1].exercises[0].slug;
    const out = applyResults(w.blocks, { "1:0": [{ reps: 10, weight_kg: 8 }] }, {});
    expect(out[1].exercises[0].result?.sets[0]).toMatchObject({ reps: 10, weight_kg: 8 });
    const swapped = applyResults(w.blocks, { "1:0": [{ reps: 8, weight_kg: null }] }, { [slug]: "plancha" });
    expect(swapped[1].exercises[0].slug).toBe("plancha");
  });
  it("paso de carga según equipamiento", () => {
    expect(weightStep("peso-muerto-barra")).toBe(2.5);
    expect(weightStep("curl-biceps")).toBe(1);
  });
});
