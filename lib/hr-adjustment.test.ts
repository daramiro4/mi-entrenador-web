import { describe, expect, it } from "vitest";
import { assessZ2, describeHrAdjustment, hrAdjustedFtp, isPoorRecovery, z2PowerRange, z3PlusShare } from "./hr-adjustment";

const base = { pctBefore: 0, avgPower: 140, ftpUsed: 212, zones: { z1: 0, z2: 0, z3: 0, z4: 0, z5: 0 }, sleepMinutes: 450, restingHr: 47, restingHrBaseline: 47 };
const zones = (high: number) => ({ z1: 0, z2: 100 - high, z3: high, z4: 0, z5: 0 });

describe("z3PlusShare / z2PowerRange", () => {
  it("fracción de tiempo en Z3+", () => {
    expect(z3PlusShare({ z1: 100, z2: 100, z3: 100, z4: 100, z5: 0 })).toBe(0.5);
    expect(z3PlusShare(null)).toBeNull();
  });
  it("rango de Z2 con FTP 208 = 135-156 W", () => expect(z2PowerRange(208)).toEqual({ low: 135, high: 156 }));
});

describe("assessZ2", () => {
  it("más del 60 % en Z3+ → -15 %", () => {
    expect(assessZ2({ ...base, zones: zones(88) })).toMatchObject({ pct_after: 15, outcome: "increase" });
  });
  it("40-60 % → -8 %", () => {
    expect(assessZ2({ ...base, zones: zones(50) })).toMatchObject({ pct_after: 8, outcome: "increase" });
  });
  it("se acumula con tope de -20 %", () => {
    expect(assessZ2({ ...base, pctBefore: 15, ftpUsed: 180, avgPower: 125, zones: zones(80) }).pct_after).toBe(20);
  });
  it("con mal sueño no pasa de -8 % y sugiere descanso", () => {
    const r = assessZ2({ ...base, zones: zones(90), sleepMinutes: 300 });
    expect(r).toMatchObject({ pct_after: 8, suggest_rest: true, poor_recovery: true });
  });
  it("potencia por encima del rango: el pulso alto es esperable, no cambia", () => {
    expect(assessZ2({ ...base, avgPower: 190, zones: zones(90) })).toMatchObject({ pct_after: 0, outcome: "hold" });
  });
  it("potencia muy por debajo del rango: no se evalúa", () => {
    expect(assessZ2({ ...base, avgPower: 90, zones: zones(90) }).outcome).toBe("hold");
  });
  it("sesión buena (<25 % en Z3+) retira 5 puntos hasta 0", () => {
    expect(assessZ2({ ...base, pctBefore: 15, zones: zones(10) })).toMatchObject({ pct_after: 10, outcome: "decrease" });
    expect(assessZ2({ ...base, pctBefore: 3, zones: zones(10) }).pct_after).toBe(0);
  });
  it("entre 25 y 40 % mantiene", () => {
    expect(assessZ2({ ...base, pctBefore: 8, zones: zones(30) })).toMatchObject({ pct_after: 8, outcome: "hold" });
  });
  it("sin zonas, potencia o FTP: skipped", () => {
    expect(assessZ2({ ...base, zones: null }).outcome).toBe("skipped");
    expect(assessZ2({ ...base, ftpUsed: null }).outcome).toBe("skipped");
  });
});

describe("hrAdjustedFtp", () => {
  it("aplica el descuento sobre el FTP efectivo", () => {
    expect(hrAdjustedFtp(208, 15)).toBe(177);
    expect(hrAdjustedFtp(213, 15)).toBe(181);
    expect(hrAdjustedFtp(213, 0)).toBe(213);
  });
  it("con el FTP efectivo 213 y -15 %, la Z2 queda en 118-136 W", () => {
    expect(z2PowerRange(hrAdjustedFtp(213, 15))).toEqual({ low: 118, high: 136 });
  });
});

describe("isPoorRecovery", () => {
  it("poco sueño o FC reposo +5", () => {
    expect(isPoorRecovery({ sleepMinutes: 300, restingHr: null, restingHrBaseline: null })).toBe(true);
    expect(isPoorRecovery({ sleepMinutes: 450, restingHr: 52, restingHrBaseline: 47 })).toBe(true);
    expect(isPoorRecovery({ sleepMinutes: 450, restingHr: 48, restingHrBaseline: 47 })).toBe(false);
  });
});

describe("describeHrAdjustment", () => {
  it("explica la subida, la bajada y calla si no hay cambio", () => {
    expect(describeHrAdjustment(assessZ2({ ...base, zones: zones(88) }))).toMatch(/-15 % de vatios/);
    expect(describeHrAdjustment(assessZ2({ ...base, pctBefore: 15, zones: zones(10) }))).toMatch(/baja a -10 %/);
    expect(describeHrAdjustment(assessZ2({ ...base, zones: zones(30) }))).toBeNull();
    expect(describeHrAdjustment(null)).toBeNull();
  });
});
