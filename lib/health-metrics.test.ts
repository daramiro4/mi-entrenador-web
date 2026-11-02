import { describe, expect, it } from "vitest";
import { ageLabel, summarizeHealthMetrics } from "./health-metrics";
import type { DailyMetricsRow } from "@/lib/types";

function row(date: string, over: Partial<DailyMetricsRow> = {}): DailyMetricsRow {
  return {
    id: 1, user_id: "u", date, created_at: "", source: "garmin",
    sleep_score: null, sleep_duration_minutes: null, stress_avg: null, hrv_ms: null,
    resting_hr: null, body_battery_max: null, body_battery_min: null, weight_kg: null, body_fat_pct: null,
    ...over,
  };
}
const get = (s: ReturnType<typeof summarizeHealthMetrics>, k: string) => s.find((m) => m.key === k)!;

describe("ageLabel", () => {
  it("hoy → null, ayer, hace N días", () => {
    expect(ageLabel("2026-11-02", "2026-11-02")).toBeNull();
    expect(ageLabel("2026-11-01", "2026-11-02")).toBe("ayer");
    expect(ageLabel("2026-10-30", "2026-11-02")).toBe("hace 3 días");
  });
});

describe("summarizeHealthMetrics", () => {
  const today = "2026-11-02";

  it("usa el último valor disponible de cada métrica, aunque la última fila esté incompleta", () => {
    const history = [
      row("2026-10-31", { sleep_score: 89, body_battery_min: 7, body_battery_max: 91, resting_hr: 46 }),
      row("2026-11-01", { body_battery_min: 11, body_battery_max: 52, resting_hr: 52 }),
    ];
    const s = summarizeHealthMetrics(history, today);
    expect(get(s, "sleep")).toMatchObject({ text: "89", date: "2026-10-31", ageLabel: "hace 2 días", isToday: false });
    expect(get(s, "bodyBattery")).toMatchObject({ text: "11–52", date: "2026-11-01", ageLabel: "ayer" });
    expect(get(s, "rhr").text).toBe("52 ppm");
  });

  it("una fila vacía al final no tapa el dato anterior", () => {
    const history = [row("2026-11-01", { sleep_score: 70 }), row("2026-11-02")];
    expect(get(summarizeHealthMetrics(history, today), "sleep")).toMatchObject({ text: "70", ageLabel: "ayer" });
  });

  it("dato de hoy: isToday y sin etiqueta de antigüedad", () => {
    const s = summarizeHealthMetrics([row(today, { hrv_ms: 54.4 })], today);
    expect(get(s, "hrv")).toMatchObject({ text: "54 ms", isToday: true, ageLabel: null });
  });

  it("sin ningún dato: text null", () => {
    const s = summarizeHealthMetrics([row("2026-11-01")], today);
    expect(s.every((m) => m.text === null && m.date === null && !m.isToday)).toBe(true);
  });

  it("Body Battery con solo el máximo muestra el máximo", () => {
    const s = summarizeHealthMetrics([row(today, { body_battery_max: 80 })], today);
    expect(get(s, "bodyBattery").text).toBe("80");
  });

  it("la serie solo incluye filas con dato, en orden", () => {
    const history = [row("2026-10-30", { resting_hr: 45 }), row("2026-10-31"), row("2026-11-01", { resting_hr: 47 })];
    expect(get(summarizeHealthMetrics(history, today), "rhr").series).toEqual([45, 47]);
  });
});
