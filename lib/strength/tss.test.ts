import { describe, expect, it } from "vitest";
import {
  DEFAULT_PLANNED_STRENGTH_MINUTES,
  plannedStrengthTss,
  plannedStrengthTssForSession,
  STRENGTH_LOAD_TO_TSS,
  strengthActivityTss,
  strengthTss,
} from "./tss";

describe("strengthTss (RPE)", () => {
  it("30 min a RPE 6 ≈ 20,5 TSS y acota el RPE a 1-10", () => {
    expect(strengthTss(30, 6)).toBe(20.5);
    expect(strengthTss(30, 99)).toBe(strengthTss(30, 10));
    expect(strengthTss(30, -3)).toBe(strengthTss(30, 1));
  });
});

describe("strengthActivityTss (sesión hecha)", () => {
  it("el factor de partida es 1:1", () => {
    expect(STRENGTH_LOAD_TO_TSS).toBe(1);
  });
  it("un tss ya guardado (RPE) manda sobre el training_load y no es estimado", () => {
    expect(strengthActivityTss({ tss: 30, training_load: 99 })).toEqual({ tss: 30, estimated: false });
  });
  it("sin tss usa el training_load de Garmin 1:1 y lo marca como estimado", () => {
    expect(strengthActivityTss({ tss: null, training_load: 36.6 })).toEqual({ tss: 36.6, estimated: true });
  });
  it("acepta el training_load como texto numérico (numeric de Postgres)", () => {
    expect(strengthActivityTss({ tss: null, training_load: "20.05" })).toEqual({ tss: 20.05, estimated: true });
  });
  it("no inventa: sin tss ni carga (o carga 0/inválida) devuelve null", () => {
    expect(strengthActivityTss({ tss: null, training_load: null })).toBeNull();
    expect(strengthActivityTss({ tss: 0, training_load: 0 })).toBeNull();
    expect(strengthActivityTss({ training_load: "x" })).toBeNull();
    expect(strengthActivityTss({})).toBeNull();
  });
});

describe("objetivo de una sesión de fuerza planificada", () => {
  it("por defecto 50 min a RPE 6 ≈ 34 TSS", () => {
    expect(DEFAULT_PLANNED_STRENGTH_MINUTES).toBe(50);
    expect(plannedStrengthTss()).toBe(34.1);
  });
  it("estima solo la fuerza sin planned_tss y no saltada", () => {
    const base = { session_type: "strength", status: "planned", planned_tss: null, notes: null };
    expect(plannedStrengthTssForSession(base)).toBe(34.1);
    expect(plannedStrengthTssForSession({ ...base, status: "done" })).toBe(34.1);
    expect(plannedStrengthTssForSession({ ...base, status: "degraded" })).toBe(34.1);
    expect(plannedStrengthTssForSession({ ...base, status: "skipped" })).toBeNull();
    expect(plannedStrengthTssForSession({ ...base, planned_tss: 25 })).toBeNull();
    expect(plannedStrengthTssForSession({ ...base, session_type: "z2" })).toBeNull();
  });
  it("respeta notes.duration_minutes si existe", () => {
    expect(plannedStrengthTssForSession({ session_type: "strength", planned_tss: null, notes: { duration_minutes: 30 } })).toBe(strengthTss(30, 6));
  });
});
