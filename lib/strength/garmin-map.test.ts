import { describe, expect, it } from "vitest";
import { buildGarminWorkout, countSteps, type GarminStep } from "./garmin-map";
import { generateWorkout } from "./engine";
import { EXERCISES } from "./library";
import type { GenerateInput } from "./workout-types";

const input = (format: GenerateInput["format"], history: GenerateInput["history"] = []): GenerateInput => ({
  prefs: { days_per_week: 2, session_minutes: 30, equipment: ["bodyweight", "dumbbell", "band"], level: 2, limitations: [], excluded_areas: [] },
  format, history, recentDiscomfort: [], recentSlugs: [], recentNames: [], seed: 11,
});

function flat(steps: GarminStep[]): GarminStep[] {
  return steps.flatMap((s) => (s.type === "RepeatGroupDTO" ? [s, ...flat(s.workoutSteps as GarminStep[])] : [s]));
}

describe("mapeo a Garmin (dry-run)", () => {
  it("toda la biblioteca tiene categoría y ejercicio de Garmin con formato MAYÚSCULAS_GUION_BAJO", () => {
    for (const e of EXERCISES) expect(e.garmin_category + "/" + e.garmin_exercise).toMatch(/^[A-Z_0-9]+\/[A-Z_0-9]+$/);
  });
  it("genera un payload de fuerza válido para todos los formatos", () => {
    for (const f of ["circuito", "amrap", "emom", "contrarreloj", "piramide"] as const) {
      const w = generateWorkout(input(f)).workout!;
      const { payload, unmapped } = buildGarminWorkout(w);
      expect(payload.sportType.sportTypeKey).toBe("strength_training");
      expect(payload.workoutSegments).toHaveLength(1);
      expect(unmapped).toEqual([]);
      const all = flat(payload.workoutSegments[0].workoutSteps);
      const orders = all.map((s) => s.stepOrder);
      expect(new Set(orders).size).toBe(orders.length); // stepOrder único
      expect(countSteps(payload.workoutSegments[0].workoutSteps)).toBeGreaterThan(5);
      for (const s of all.filter((x) => x.type === "ExecutableStepDTO" && (x.stepType as { stepTypeKey: string }).stepTypeKey === "interval")) {
        expect(s.category).toMatch(/^[A-Z_]+$/);
        expect(typeof s.endConditionValue).toBe("number");
      }
    }
  });
  it("circuito: un grupo de repetición con las rondas de la rutina", () => {
    const w = generateWorkout(input("circuito")).workout!;
    const { payload } = buildGarminWorkout(w);
    const group = payload.workoutSegments[0].workoutSteps.find((s) => s.type === "RepeatGroupDTO")!;
    expect(group.numberOfIterations).toBe(w.blocks[1].rounds);
  });
  it("pirámide: un paso por escalón con sus repeticiones", () => {
    const w = generateWorkout(input("piramide")).workout!;
    const { payload } = buildGarminWorkout(w);
    const reps = flat(payload.workoutSegments[0].workoutSteps)
      .filter((s) => (s.endCondition as { conditionTypeKey: string } | undefined)?.conditionTypeKey === "reps")
      .map((s) => s.endConditionValue);
    const scheme = w.blocks[1].exercises.find((e) => e.rep_scheme)!.rep_scheme!;
    expect(reps.slice(0, scheme.length)).toEqual(scheme);
  });
  it("EMOM y AMRAP avisan de su traducción parcial", () => {
    expect(buildGarminWorkout(generateWorkout(input("emom")).workout!).notes.join()).toMatch(/EMOM/);
    expect(buildGarminWorkout(generateWorkout(input("amrap")).workout!).notes.join()).toMatch(/AMRAP/);
  });
  it("el peso se envía en gramos con unidad kilogramo", () => {
    const w = generateWorkout(input("circuito")).workout!;
    w.blocks[1].exercises[0].weight_kg = 12.5;
    const step = flat(buildGarminWorkout(w).payload.workoutSegments[0].workoutSteps).find((s) => s.weightValue);
    expect(step?.weightValue).toBe(12500);
    expect((step?.weightUnit as { unitKey: string }).unitKey).toBe("kilogram");
  });
  it("sin credenciales ni datos personales en el payload", () => {
    const s = JSON.stringify(buildGarminWorkout(generateWorkout(input("circuito")).workout!).payload);
    expect(s).not.toMatch(/password|token|secret|@/i);
  });
});
