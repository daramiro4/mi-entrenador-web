import { describe, expect, it } from "vitest";
import { generateWorkout } from "./engine";
import { buildSteps } from "./steps";
import { buildGarminWorkout } from "./garmin-map";
import { describeLine, mainExercises } from "./describe";
import { SELECTABLE_FORMATS } from "./formats";
import { EXERCISE_BY_SLUG } from "./library";
import type { GenerateInput, Prefs } from "./workout-types";

// Perfil real de la petición: hombre de 40, ~100 kg, fuerte, ciclista, muchas horas en coche.
const prefs = (m: number): Prefs => ({
  days_per_week: 3,
  session_minutes: m,
  equipment: ["bodyweight", "machine", "dumbbell", "band", "kettlebell", "cable", "barbell"],
  level: 2,
  limitations: [],
  excluded_areas: [],
});
const input = (over: Partial<GenerateInput> & { minutes?: number } = {}): GenerateInput => ({
  prefs: prefs(over.minutes ?? 45), format: "completa", history: [], recentDiscomfort: [], recentSlugs: [], recentNames: [], seed: 1, ...over,
});

describe("Fuerza completa", () => {
  it("es el único formato que se ofrece", () => {
    expect(SELECTABLE_FORMATS.map((f) => f.slug)).toEqual(["completa"]);
  });

  it("siempre genera una rutina válida a 30, 45 y 60 min (200 semillas)", () => {
    for (const minutes of [30, 45, 60]) {
      for (let seed = 1; seed <= 200; seed++) {
        const r = generateWorkout(input({ minutes, seed }));
        expect(r.workout, `${minutes} min semilla ${seed}: ${JSON.stringify(r.attempts)}`).not.toBeNull();
      }
    }
  });

  it("5-7 ejercicios, 3 series cada uno y todos los grupos musculares", () => {
    for (let seed = 1; seed <= 50; seed++) {
      const w = generateWorkout(input({ seed, minutes: 60 })).workout!;
      const exs = mainExercises(w.blocks);
      expect(exs.length).toBeGreaterThanOrEqual(5);
      expect(exs.length).toBeLessThanOrEqual(7);
      expect(exs.every((e) => e.sets === 3)).toBe(true);
      const patterns = new Set(exs.map((e) => e.pattern));
      for (const p of ["hinge", "squat", "pull", "push", "core"]) expect(patterns.has(p as never), p).toBe(true);
      const pull = exs.filter((e) => e.pattern === "pull").length;
      const push = exs.filter((e) => e.pattern === "push").length;
      expect(pull).toBeGreaterThanOrEqual(push);
    }
  });

  it("el calentamiento incluye movilidad de cadera o torácica (postura de conductor)", () => {
    const w = generateWorkout(input()).workout!;
    const warm = w.blocks.find((b) => b.kind === "warmup")!.exercises.map((e) => e.slug);
    expect(warm.some((s) => s === "flexor-cadera" || s === "rotacion-toracica")).toBe(true);
  });

  it("varía los ejercicios entre días consecutivos (A/B/C)", () => {
    let recent: string[] = [];
    const days: string[][] = [];
    for (let day = 0; day < 3; day++) {
      const w = generateWorkout(input({ seed: 100 + day * 17, recentSlugs: recent })).workout!;
      const slugs = mainExercises(w.blocks).map((e) => e.slug);
      days.push(slugs);
      recent = [...slugs, ...recent].slice(0, 14);
    }
    const overlap = (a: string[], b: string[]) => a.filter((s) => b.includes(s)).length;
    // Con tanta biblioteca, dos días seguidos comparten como mucho 2 ejercicios.
    expect(overlap(days[0], days[1])).toBeLessThanOrEqual(2);
    expect(overlap(days[1], days[2])).toBeLessThanOrEqual(2);
  });

  it("sin pierna pesada si mañana hay bici de calidad", () => {
    for (let seed = 1; seed <= 50; seed++) {
      const w = generateWorkout(input({ seed, nextDayQuality: true })).workout!;
      expect(mainExercises(w.blocks).every((e) => EXERCISE_BY_SLUG[e.slug].leg_load !== "heavy")).toBe(true);
    }
  });

  it("evita ejercicios de poco valor cuando hay alternativa con carga", () => {
    const low = ["elevacion-talones", "sentadilla-isometrica-pared", "curl-biceps", "buenos-dias-mancuerna", "superman"];
    let lowCount = 0;
    for (let seed = 1; seed <= 100; seed++) {
      const w = generateWorkout(input({ seed })).workout!;
      lowCount += mainExercises(w.blocks).filter((e) => low.includes(e.slug)).length;
    }
    expect(lowCount).toBe(0);
  });

  it("entreno en vivo: 3 series por ejercicio, con descanso entre ellas", () => {
    const w = generateWorkout(input()).workout!;
    const exs = mainExercises(w.blocks);
    const steps = buildSteps(w).filter((s) => s.blockIdx === 1);
    expect(steps.filter((s) => s.kind === "work").length).toBe(exs.length * 3);
    const first = steps.filter((s) => s.exIdx === 0 && s.kind === "work");
    expect(first.map((s) => `${s.setNo}/${s.setsTotal}`)).toEqual(["1/3", "2/3", "3/3"]);
    expect(steps.some((s) => s.kind === "rest" && (s.rest_s ?? 0) >= 60)).toBe(true);
  });

  it("Garmin: una serie por paso, con su descanso", () => {
    const w = generateWorkout(input()).workout!;
    const exs = mainExercises(w.blocks);
    const built = buildGarminWorkout({ ...w, name: w.name, guidance: null });
    const flat = JSON.stringify(built.payload.workoutSegments[0].workoutSteps);
    const mainSteps = (flat.match(/"stepType":\{"stepTypeId":3/g) ?? []).length; // interval
    expect(mainSteps).toBeGreaterThanOrEqual(exs.length * 3);
  });

  it("describe '3 × 8 reps'", () => {
    const w = generateWorkout(input()).workout!;
    const line = mainExercises(w.blocks).find((e) => e.mode === "reps")!;
    expect(describeLine(line, w.blocks[1])).toMatch(/^3 × \d+ reps/);
  });
});
