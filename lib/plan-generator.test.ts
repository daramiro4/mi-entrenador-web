import { describe, expect, it } from "vitest";
import {
  computeQualityDaysPerWeek,
  computeWeeklyTssTarget,
  generateWeeklyPlan,
  getReacclimatizationDiscountPct,
} from "./plan-generator";

describe("computeWeeklyTssTarget", () => {
  it("hours_per_week * 55, redondeado a múltiplo de 5", () => {
    expect(computeWeeklyTssTarget(8)).toBe(440);
  });

  it("usa 6h por defecto si hours_per_week es null", () => {
    expect(computeWeeklyTssTarget(null)).toBe(330);
  });
});

describe("computeQualityDaysPerWeek", () => {
  it("2 días si goal_type es ftp_improvement", () => {
    expect(computeQualityDaysPerWeek("ftp_improvement", [])).toBe(2);
  });

  it("2 días si focus_areas incluye vo2max/climbing/rouleur", () => {
    expect(computeQualityDaysPerWeek("maintenance", ["vo2max"])).toBe(2);
  });

  it("1 día en cualquier otro caso", () => {
    expect(computeQualityDaysPerWeek("maintenance", ["general_health"])).toBe(1);
  });
});

describe("getReacclimatizationDiscountPct", () => {
  it("0% con menos de 2 semanas", () => {
    expect(getReacclimatizationDiscountPct(13)).toBe(0);
  });

  it("-5% entre 2 y 4 semanas", () => {
    expect(getReacclimatizationDiscountPct(14)).toBe(-0.05);
    expect(getReacclimatizationDiscountPct(27)).toBe(-0.05);
  });

  it("-10% entre 4 y 8 semanas", () => {
    expect(getReacclimatizationDiscountPct(28)).toBe(-0.1);
    expect(getReacclimatizationDiscountPct(55)).toBe(-0.1);
  });

  it("-15% tope a partir de 8 semanas", () => {
    expect(getReacclimatizationDiscountPct(56)).toBe(-0.15);
    expect(getReacclimatizationDiscountPct(1000)).toBe(-0.15);
  });
});

describe("generateWeeklyPlan", () => {
  it("semana normal: fuerza espaciada, calidad nunca justo después de fuerza, TSS repartido", () => {
    const week = generateWeeklyPlan({
      weekStartDate: "2026-09-07",
      goalType: "ftp_improvement",
      focusAreas: ["vo2max"],
      hoursPerWeek: 8,
      strengthDaysPerWeek: 2,
      currentFtpWatts: 250,
      lastCyclingActivityDate: "2026-09-01",
      today: "2026-09-07",
    });

    expect(week).toHaveLength(7);
    expect(new Set(week.map((d) => d.date)).size).toBe(7);

    const noQualityAfterStrength = week.every(
      (day, i) =>
        i === 0 || !(week[i - 1].session_type === "strength" && day.session_type === "quality")
    );
    expect(noQualityAfterStrength).toBe(true);

    expect(week.filter((d) => d.session_type === "rest")).toHaveLength(1);
    expect(week.reduce((sum, d) => sum + (d.planned_tss ?? 0), 0)).toBeGreaterThan(0);
  });

  it("hours_per_week null y maintenance: sigue generando 7 días con TSS", () => {
    const week = generateWeeklyPlan({
      weekStartDate: "2026-09-07",
      goalType: "maintenance",
      focusAreas: ["general_health"],
      hoursPerWeek: null,
      strengthDaysPerWeek: null,
      currentFtpWatts: null,
      lastCyclingActivityDate: "2026-09-05",
      today: "2026-09-07",
    });

    expect(week).toHaveLength(7);
    expect(week.filter((d) => d.session_type === "quality")).toHaveLength(1);
    expect(week.filter((d) => d.session_type === "rest")).toHaveLength(1);
  });

  it("≥14 días sin actividad: ventana de reaclimatación en vez de la plantilla normal", () => {
    const week = generateWeeklyPlan({
      weekStartDate: "2026-09-07",
      goalType: "ftp_improvement",
      focusAreas: ["vo2max"],
      hoursPerWeek: 8,
      strengthDaysPerWeek: 2,
      currentFtpWatts: 250,
      lastCyclingActivityDate: "2026-08-08", // 30 días antes
      today: "2026-09-07",
    });

    expect(week.filter((d) => d.session_type === "z2")).toHaveLength(4);
    expect(week.filter((d) => d.session_type === "rest")).toHaveLength(2);

    const rampTest = week.find((d) => d.notes?.kind === "ramp_test");
    expect(rampTest?.session_type).toBe("quality");
    expect(rampTest?.notes?.reacclimatization_discount_pct).toBe(-0.1);

    // Ninguna sesión de la ventana lleva TSS objetivo.
    expect(week.every((d) => d.planned_tss === null)).toBe(true);
  });

  it("nunca ha registrado ciclismo (lastCyclingActivityDate null): también entra en reaclimatación, tope -15%", () => {
    const week = generateWeeklyPlan({
      weekStartDate: "2026-09-07",
      goalType: "maintenance",
      focusAreas: [],
      hoursPerWeek: 5,
      strengthDaysPerWeek: 0,
      currentFtpWatts: null,
      lastCyclingActivityDate: null,
      today: "2026-09-07",
    });

    const rampTest = week.find((d) => d.notes?.kind === "ramp_test");
    expect(rampTest?.notes?.reacclimatization_discount_pct).toBe(-0.15);
  });
});
