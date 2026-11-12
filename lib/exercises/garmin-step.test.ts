import { describe, expect, it } from "vitest";
import { buildGarminStrengthStep, GarminStepError } from "./garmin-step";
import { buildGarminWorkout } from "../strength/garmin-map";
import { generateWorkout } from "../strength/engine";

const squat = { garmin_category: "SQUAT", garmin_name: "GOBLET_SQUAT" };

describe("buildGarminStrengthStep (formato de garminconnect 0.3.20)", () => {
  it("paso por repeticiones: condición de fin 'reps' (id 10) y sin objetivo", () => {
    expect(buildGarminStrengthStep(squat, { type: "reps", reps: 10 }, { stepOrder: 1 })).toEqual({
      type: "ExecutableStepDTO",
      stepOrder: 1,
      stepType: { stepTypeId: 3, stepTypeKey: "interval", displayOrder: 3 },
      endCondition: { conditionTypeId: 10, conditionTypeKey: "reps", displayOrder: 10, displayable: true },
      endConditionValue: 10,
      targetType: { workoutTargetTypeId: 1, workoutTargetTypeKey: "no.target", displayOrder: 1 },
      category: "SQUAT",
      exerciseName: "GOBLET_SQUAT",
    });
  });

  it("paso por tiempo: condición de fin 'time' (id 2), con su propio id", () => {
    const s = buildGarminStrengthStep({ garmin_category: "WARM_UP", garmin_name: "THORACIC_ROTATION" }, { type: "time", seconds: 40 }, { stepOrder: 3 });
    expect(s.endCondition).toEqual({ conditionTypeId: 2, conditionTypeKey: "time", displayOrder: 2, displayable: true });
    expect(s.endConditionValue).toBe(40);
  });

  it("el peso viaja en gramos con unidad kilogramo", () => {
    const s = buildGarminStrengthStep(squat, { type: "reps", reps: 8 }, { stepOrder: 1, weight_kg: 12.5 });
    expect(s.weightValue).toBe(12500);
    expect(s.weightUnit).toEqual({ unitId: 8, unitKey: "kilogram", factor: 1000 });
  });

  it("sin peso (o 0 kg) no manda weightValue", () => {
    expect("weightValue" in buildGarminStrengthStep(squat, { type: "reps", reps: 8 }, { stepOrder: 1 })).toBe(false);
    expect("weightValue" in buildGarminStrengthStep(squat, { type: "reps", reps: 8 }, { stepOrder: 1, weight_kg: 0 })).toBe(false);
  });

  it("recorta la descripción a 80 caracteres", () => {
    const s = buildGarminStrengthStep(squat, { type: "reps", reps: 8 }, { stepOrder: 1, description: "x".repeat(200) });
    expect(s.description).toHaveLength(80);
  });

  it("rechaza claves que Garmin no aceptaría y dosis fuera de rango", () => {
    expect(() => buildGarminStrengthStep({ garmin_category: "squat", garmin_name: "GOBLET_SQUAT" }, { type: "reps", reps: 8 }, { stepOrder: 1 })).toThrow(GarminStepError);
    expect(() => buildGarminStrengthStep({ garmin_category: "SQUAT", garmin_name: "Goblet Squat" }, { type: "reps", reps: 8 }, { stepOrder: 1 })).toThrow(GarminStepError);
    expect(() => buildGarminStrengthStep({ garmin_category: "SQUAT", garmin_name: "" }, { type: "reps", reps: 8 }, { stepOrder: 1 })).toThrow(GarminStepError);
    expect(() => buildGarminStrengthStep(squat, { type: "reps", reps: 0 }, { stepOrder: 1 })).toThrow(GarminStepError);
    expect(() => buildGarminStrengthStep(squat, { type: "reps", reps: 8.5 }, { stepOrder: 1 })).toThrow(GarminStepError);
    expect(() => buildGarminStrengthStep(squat, { type: "time", seconds: 99999 }, { stepOrder: 1 })).toThrow(GarminStepError);
    expect(() => buildGarminStrengthStep(squat, { type: "reps", reps: 8 }, { stepOrder: 0 })).toThrow(GarminStepError);
    expect(() => buildGarminStrengthStep(squat, { type: "reps", reps: 8 }, { stepOrder: 1, weight_kg: -3 })).toThrow(GarminStepError);
  });

  it("es idéntico al paso que ya envía el módulo de fuerza (lib/strength/garmin-map.ts)", () => {
    const w = generateWorkout({
      prefs: { days_per_week: 3, session_minutes: 45, equipment: ["bodyweight", "dumbbell", "band"], level: 2, limitations: [], excluded_areas: [] },
      format: "completa", history: [], recentDiscomfort: [], recentSlugs: [], recentNames: [], seed: 5,
    }).workout!;
    const shipped = buildGarminWorkout(w).payload.workoutSegments[0].workoutSteps;
    // Primer paso ejecutable del calentamiento (por tiempo, sin peso): mismo formato.
    const first = shipped[0] as Record<string, unknown>;
    const built = buildGarminStrengthStep(
      { garmin_category: String(first.category), garmin_name: String(first.exerciseName) },
      { type: "time", seconds: Number(first.endConditionValue) },
      { stepOrder: Number(first.stepOrder), description: String(first.description) },
    );
    expect(built).toEqual(first);
  });
});
