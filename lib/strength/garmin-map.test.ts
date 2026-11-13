import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { buildGarminWorkout, CARDIO_GARMIN, countSteps, type GarminStep } from "./garmin-map";
import { generateWorkout } from "./engine";
import { EXERCISES } from "./library";
import { GARMIN_OVERRIDES } from "./garmin-overrides";
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
    for (const f of ["completa", "circuito", "amrap", "emom", "contrarreloj", "piramide"] as const) {
      const w = generateWorkout(input(f)).workout!;
      const { payload, unmapped } = buildGarminWorkout(w);
      expect(payload.sportType.sportTypeKey).toBe("strength_training");
      expect(payload.workoutSegments).toHaveLength(1);
      expect(unmapped).toEqual([]);
      const all = flat(payload.workoutSegments[0].workoutSteps);
      const orders = all.map((s) => s.stepOrder);
      expect(new Set(orders).size).toBe(orders.length); // stepOrder único
      expect(countSteps(payload.workoutSegments[0].workoutSteps)).toBeGreaterThan(3);
      for (const s of all.filter((x) => x.type === "ExecutableStepDTO" && (x.stepType as { stepTypeKey: string }).stepTypeKey === "interval")) {
        expect(s.category).toMatch(/^[A-Z_]+$/);
        expect(typeof s.endConditionValue).toBe("number");
      }
    }
  });
  it("fuerza completa: un grupo 'N series' por ejercicio (ejercicio + descanso), como el editor de Garmin", () => {
    const w = generateWorkout({ ...input("completa"), prefs: { ...input("completa").prefs, session_minutes: 45 } }).workout!;
    const { payload } = buildGarminWorkout(w);
    const top = payload.workoutSegments[0].workoutSteps;
    const groups = top.filter((s) => s.type === "RepeatGroupDTO");
    const main = w.blocks[1].exercises;
    expect(groups).toHaveLength(main.length);
    for (const g of groups) {
      expect(g.numberOfIterations).toBe(3);
      expect((g.endCondition as { conditionTypeKey: string }).conditionTypeKey).toBe("iterations");
      const inner = g.workoutSteps as GarminStep[];
      expect(inner).toHaveLength(2);
      expect((inner[0].stepType as { stepTypeKey: string }).stepTypeKey).toBe("interval");
      expect((inner[1].stepType as { stepTypeKey: string }).stepTypeKey).toBe("rest");
      expect(inner[1].endConditionValue as number).toBeGreaterThanOrEqual(60);
    }
    // el cardio en cinta (1 paso por tiempo) va antes de los bloques de series
    expect(top[0].type).toBe("ExecutableStepDTO");
    expect(top.slice(1).every((s) => s.type === "RepeatGroupDTO")).toBe(true);
    // pasos totales mucho menores que con series planas
    expect(top.length).toBe(1 + main.length);
  });
  it("las correcciones del catálogo existen en el formato esperado y se aplican", () => {
    for (const [slug, [cat, ex]] of Object.entries(GARMIN_OVERRIDES)) {
      expect(EXERCISES.some((e) => e.slug === slug), slug).toBe(true);
      expect(`${cat}/${ex}`).toMatch(/^[A-Z_0-9]+\/[A-Z_0-9]+$/);
    }
    const w = generateWorkout(input("circuito")).workout!;
    w.blocks[1].exercises[0] = { ...w.blocks[1].exercises[0], slug: "peso-muerto-kettlebell", name: "Peso muerto con kettlebell" };
    const step = flat(buildGarminWorkout(w).payload.workoutSegments[0].workoutSteps).find((s) => s.exerciseName === "KETTLEBELL_DEADLIFT");
    expect(step?.category).toBe("DEADLIFT");
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

describe("cardio en cinta en el reloj", () => {
  it("RUN_INDOOR/TREADMILL existe en el catálogo de Garmin y el FIT SDK lo conoce", () => {
    const cat = JSON.parse(readFileSync("data/garmin-exercises.json", "utf8")) as { exercises: { garmin_category: string; garmin_name: string; fit_sdk_known: boolean }[] };
    const e = cat.exercises.find((x) => x.garmin_category === CARDIO_GARMIN[0] && x.garmin_name === CARDIO_GARMIN[1]);
    expect(e, `${CARDIO_GARMIN.join("/")} no está en el catálogo`).toBeDefined();
    expect(e!.fit_sdk_known).toBe(true);
  });
});

