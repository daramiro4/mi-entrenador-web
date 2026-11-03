import { describe, expect, it } from "vitest";
import { clampSessionMinutes, MAX_SESSION_MINUTES, MIN_SESSION_MINUTES, SESSION_MINUTE_OPTIONS } from "./prefs-limits";

describe("duración de sesión", () => {
  it("limita a 30-60 min y redondea", () => {
    expect(clampSessionMinutes(60)).toBe(60);
    expect(clampSessionMinutes(90)).toBe(60);
    expect(clampSessionMinutes(20)).toBe(30);
    expect(clampSessionMinutes(44.6)).toBe(45);
    expect(clampSessionMinutes(Number.NaN)).toBe(45);
  });

  it("las opciones ofrecidas están dentro de los límites", () => {
    expect(Math.min(...SESSION_MINUTE_OPTIONS)).toBe(MIN_SESSION_MINUTES);
    expect(Math.max(...SESSION_MINUTE_OPTIONS)).toBe(MAX_SESSION_MINUTES);
  });
});
