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
      recentCyclingRides14d: 5,
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
      recentCyclingRides14d: 1,
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
      recentCyclingRides14d: 0,
      lastCyclingActivityDate: "2026-08-08", // 30 días antes
      today: "2026-09-07",
    });

    // Tres Z2 con un día de descanso entre ellas (lunes, miércoles, viernes) y sin test de rampa todavía.
    const z2Days = week.map((d, i) => (d.session_type === "z2" ? i : -1)).filter((i) => i >= 0);
    expect(z2Days).toEqual([0, 2, 4]);
    expect(week.filter((d) => d.session_type === "rest")).toHaveLength(4);
    expect(week.find((d) => d.notes?.kind === "ramp_test")).toBeUndefined();
    expect(week.filter((d) => d.session_type === "z2").every((d) => d.notes?.reacclimatization_discount_pct === -0.1)).toBe(true);

    // Ninguna sesión de la ventana lleva TSS objetivo.
    expect(week.every((d) => d.planned_tss === null)).toBe(true);

    // Las z2 sí llevan una duración fija y el FTP efectivo ya descontado,
    // para poder enviarse a Garmin sin TSS (decisión 5 + envío manual).
    const z2Sessions = week.filter((d) => d.session_type === "z2");
    expect(z2Sessions.every((d) => d.notes?.duration_minutes === 60)).toBe(true);
    expect(z2Sessions.every((d) => d.notes?.effective_ftp_watts === 225)).toBe(true);
  });

  it("nunca ha registrado ciclismo (lastCyclingActivityDate null): también entra en reaclimatación, tope -15%", () => {
    const week = generateWeeklyPlan({
      weekStartDate: "2026-09-07",
      goalType: "maintenance",
      focusAreas: [],
      hoursPerWeek: 5,
      strengthDaysPerWeek: 0,
      currentFtpWatts: null,
      recentCyclingRides14d: 0,
      lastCyclingActivityDate: null,
      today: "2026-09-07",
    });

    expect(week.filter((d) => d.session_type === "z2").every((d) => d.notes?.reacclimatization_discount_pct === -0.15)).toBe(true);

    // Sin FTP medido no hay base para un FTP efectivo en las notas (se usa el provisional al enviar).
    const z2Sessions = week.filter((d) => d.session_type === "z2");
    expect(z2Sessions.every((d) => d.notes?.effective_ftp_watts === undefined)).toBe(true);
    expect(z2Sessions.every((d) => d.notes?.duration_minutes === 60)).toBe(true);
  });

  it("sin FTP medido, el FTP objetivo de la temporada ya NO es la base: no hay FTP efectivo en las notas", () => {
    const week = generateWeeklyPlan({
      weekStartDate: "2026-09-07",
      goalType: "maintenance",
      focusAreas: [],
      hoursPerWeek: 5,
      strengthDaysPerWeek: 0,
      currentFtpWatts: null,
      recentCyclingRides14d: 0,
      lastCyclingActivityDate: null,
      today: "2026-09-07",
    });
    const z2Sessions = week.filter((d) => d.session_type === "z2");
    expect(z2Sessions.every((d) => d.notes?.effective_ftp_watts === undefined)).toBe(true);
  });

  const normalWeek = (o: { currentFtpWatts: number | null; recentCyclingRides14d: number }) =>
    generateWeeklyPlan({
      weekStartDate: "2026-09-14",
      goalType: "ftp_improvement",
      focusAreas: ["vo2max"],
      hoursPerWeek: 6,
      strengthDaysPerWeek: 2,
      lastCyclingActivityDate: "2026-09-12",
      today: "2026-09-14",
      ...o,
    });

  it("test de rampa: semana normal sin FTP medido y con >=3 salidas recientes → la primera calidad es el test", () => {
    const week = normalWeek({ currentFtpWatts: null, recentCyclingRides14d: 3 });
    const tests = week.filter((d) => d.notes?.kind === "ramp_test");
    expect(tests).toHaveLength(1);
    expect(tests[0].session_type).toBe("quality");
    expect(tests[0].planned_tss).toBeNull();
    expect(week.find((d) => d.session_type === "quality")).toBe(tests[0]);
  });

  it("no programa el test con menos de 3 salidas o si ya hay FTP medido", () => {
    expect(normalWeek({ currentFtpWatts: null, recentCyclingRides14d: 2 }).some((d) => d.notes?.kind === "ramp_test")).toBe(false);
    expect(normalWeek({ currentFtpWatts: 220, recentCyclingRides14d: 6 }).some((d) => d.notes?.kind === "ramp_test")).toBe(false);
  });
});
