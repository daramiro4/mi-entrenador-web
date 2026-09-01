import { describe, expect, it } from "vitest";
import { calculateTargetFtp } from "./ftp-calculator";

describe("calculateTargetFtp", () => {
  it("clasifica por W/kg y aplica la mejora media del bracket sin objetivo de peso", () => {
    const result = calculateTargetFtp({
      currentFtpWatts: 200,
      currentWeightKg: 70,
      focusAreas: [],
    });

    expect(result.category).toBe("recreacional");
    expect(result.currentWkg).toBeCloseTo(2.857, 3);
    expect(result.ftpImprovementPct).toBeCloseTo(0.115, 5); // (0.08+0.15)/2
    expect(result.targetFtpWatts).toBeCloseTo(223, 5);
    expect(result.weightGoalWasCapped).toBe(false);
    expect(result.weightLossPct).toBe(0);
  });

  it("clasifica principiante por debajo de 2.5 W/kg", () => {
    const result = calculateTargetFtp({ currentFtpWatts: 150, currentWeightKg: 75, focusAreas: [] });
    expect(result.category).toBe("principiante");
    expect(result.targetFtpWatts).toBeCloseTo(180, 5); // 150 * 1.2
  });

  it("clasifica élite a partir de 5.0 W/kg", () => {
    const result = calculateTargetFtp({ currentFtpWatts: 400, currentWeightKg: 70, focusAreas: [] });
    expect(result.category).toBe("elite");
    expect(result.targetFtpWatts).toBeCloseTo(406, 5); // 400 * 1.015
  });

  it("con weight_loss dentro del límite seguro, reduce la mejora de FTP en la misma proporción", () => {
    const result = calculateTargetFtp({
      currentFtpWatts: 250,
      currentWeightKg: 80,
      focusAreas: ["weight_loss"],
      targetWeightKg: 76, // -5%, dentro del 10% seguro
    });

    expect(result.weightGoalWasCapped).toBe(false);
    expect(result.weightLossPct).toBeCloseTo(0.05, 5);
    expect(result.effectiveTargetWeightKg).toBe(76);
    expect(result.ftpImprovementPct).toBeCloseTo(0.065, 5); // 0.115 - 0.05
  });

  it("con weight_loss por encima del 10%, capa la pérdida y ajusta el peso efectivo", () => {
    const result = calculateTargetFtp({
      currentFtpWatts: 250,
      currentWeightKg: 80,
      focusAreas: ["weight_loss"],
      targetWeightKg: 60, // -25%, muy por encima del límite seguro
    });

    expect(result.weightGoalWasCapped).toBe(true);
    expect(result.weightLossPct).toBeCloseTo(0.1, 5);
    expect(result.effectiveTargetWeightKg).toBeCloseTo(72, 5); // 80 * 0.9
    // Nunca baja del 30% de la mejora mínima del bracket (0.08 * 0.3 = 0.024).
    expect(result.ftpImprovementPct).toBeCloseTo(0.024, 5);
  });

  it("weight_loss sin targetWeightKg no activa el ajuste", () => {
    const result = calculateTargetFtp({
      currentFtpWatts: 200,
      currentWeightKg: 70,
      focusAreas: ["weight_loss"],
      targetWeightKg: null,
    });

    expect(result.weightLossPct).toBe(0);
    expect(result.weightGoalWasCapped).toBe(false);
  });
});
