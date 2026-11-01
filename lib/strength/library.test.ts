import { describe, expect, it } from "vitest";
import { EXERCISES, EXERCISE_BY_SLUG } from "./library";
import { poseInBounds, segLength, segments } from "./poses";

describe("biblioteca de ejercicios", () => {
  it("tiene ~40 ejercicios con slugs únicos", () => {
    expect(EXERCISES.length).toBeGreaterThanOrEqual(38);
    expect(new Set(EXERCISES.map((e) => e.slug)).size).toBe(EXERCISES.length);
  });
  it("las alternativas existen y no son uno mismo", () => {
    for (const e of EXERCISES) {
      for (const alt of e.alternatives) {
        expect(EXERCISE_BY_SLUG[alt], `${e.slug} -> ${alt}`).toBeDefined();
        expect(alt).not.toBe(e.slug);
      }
    }
  });
  it("cada ejercicio tiene claves, error común y mapeo Garmin", () => {
    for (const e of EXERCISES) {
      expect(e.cues_es.length).toBeGreaterThanOrEqual(2);
      expect(e.common_error_es.length).toBeGreaterThan(5);
      expect(e.garmin_category && e.garmin_exercise).toBeTruthy();
    }
  });
  it("cubre todos los patrones", () => {
    const patterns = new Set(EXERCISES.map((e) => e.pattern));
    for (const p of ["hinge", "squat", "push", "pull", "core", "carry", "mobility"]) expect(patterns.has(p as never)).toBe(true);
  });
  it("hay al menos tanto tirón como empuje", () => {
    const n = (p: string) => EXERCISES.filter((e) => e.pattern === p).length;
    expect(n("pull")).toBeGreaterThanOrEqual(n("push") + 1);
  });
});

describe("poses (snapshot geométrico)", () => {
  for (const e of EXERCISES) {
    it(`${e.slug}: articulaciones dentro del viewBox y segmentos estables (±10 %)`, () => {
      expect(poseInBounds(e.pose_a), `${e.slug} A fuera de viewBox`).toBe(true);
      expect(poseInBounds(e.pose_b), `${e.slug} B fuera de viewBox`).toBe(true);
      const sa = segments(e.pose_a);
      const sb = segments(e.pose_b);
      sa.forEach(([name, a1, a2], i) => {
        const la = segLength(a1, a2);
        const lb = segLength(sb[i][1], sb[i][2]);
        expect(Math.abs(lb - la) / la, `${e.slug} ${name}`).toBeLessThanOrEqual(0.1);
      });
    });
  }
  it("snapshot de una pose de referencia (peso muerto rumano)", () => {
    expect(EXERCISE_BY_SLUG["peso-muerto-rumano"].pose_b).toMatchSnapshot();
  });
});
