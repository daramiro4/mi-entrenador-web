import { describe, expect, it } from "vitest";
import { clampSessionMinutes, MAX_SESSION_MINUTES, MIN_SESSION_MINUTES, SESSION_MINUTE_OPTIONS } from "./prefs-limits";

describe("minutos de ejercicios por sesión", () => {
  it("limita a 30-45 min y redondea (el cardio de 10 min se suma aparte)", () => {
    expect(clampSessionMinutes(45)).toBe(45);
    expect(clampSessionMinutes(60)).toBe(45); // una preferencia antigua de 60 min pasa a 45
    expect(clampSessionMinutes(90)).toBe(45);
    expect(clampSessionMinutes(20)).toBe(30);
    expect(clampSessionMinutes(44.6)).toBe(45);
    expect(clampSessionMinutes(Number.NaN)).toBe(45);
  });

  it("las opciones ofrecidas están dentro de los límites", () => {
    expect(Math.min(...SESSION_MINUTE_OPTIONS)).toBe(MIN_SESSION_MINUTES);
    expect(Math.max(...SESSION_MINUTE_OPTIONS)).toBe(MAX_SESSION_MINUTES);
  });
});
