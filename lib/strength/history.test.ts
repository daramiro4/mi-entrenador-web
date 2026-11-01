import { describe, expect, it } from "vitest";
import { buildHistory, recentDiscomfortAreas, recentSlugs, type PastWorkout } from "./history";

const w = (o: Partial<PastWorkout> = {}): PastWorkout => ({
  date: "2026-10-30", status: "done", name: "x", rpe: 7, felt: "ok", discomfort_areas: [],
  blocks: [{ kind: "main", title: "m", exercises: [{ slug: "goblet", name: "g", pattern: "squat", mode: "reps", sets: 1, reps: 10, weight_kg: 12, rest_s: 30,
    result: { sets: [{ reps: 10, weight_kg: 12, rpe: 7 }, { reps: 9, weight_kg: 12, rpe: 8 }] } }] }],
  ...o,
});

describe("history", () => {
  it("toma la sesión más reciente por ejercicio y calcula peso/reps/rpe", () => {
    const h = buildHistory([w(), w({ date: "2026-10-20" })]);
    expect(h).toHaveLength(1);
    expect(h[0]).toMatchObject({ slug: "goblet", weight_kg: 12, target_reps: 10, reps_done: [10, 9], rpe: 8 });
  });
  it("ignora rutinas no terminadas o sin resultados", () => {
    expect(buildHistory([w({ status: "generated" })])).toHaveLength(0);
  });
  it("molestias recientes dentro de la ventana", () => {
    const past = [w({ date: "2026-10-30", discomfort_areas: ["knee"] }), w({ date: "2026-08-01", discomfort_areas: ["neck"] })];
    expect(recentDiscomfortAreas(past, "2026-11-01")).toEqual(["knee"]);
  });
  it("slugs recientes", () => expect(recentSlugs([w()])).toEqual(["goblet"]));
});
