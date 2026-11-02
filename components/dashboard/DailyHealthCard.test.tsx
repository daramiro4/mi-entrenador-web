import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DailyHealthCard } from "./DailyHealthCard";
import type { DailyMetricsRow } from "@/lib/types";

function row(date: string, over: Partial<DailyMetricsRow> = {}): DailyMetricsRow {
  return {
    id: 1, user_id: "u", date, created_at: "", source: "garmin",
    sleep_score: null, sleep_duration_minutes: null, stress_avg: null, hrv_ms: null,
    resting_hr: null, body_battery_max: null, body_battery_min: null, weight_kg: null, body_fat_pct: null,
    ...over,
  };
}

describe("DailyHealthCard", () => {
  it("sin datos de hoy: no pinta tendencias y avisa", () => {
    const history = [row("2026-10-31", { resting_hr: 50 }), row("2026-11-01", { resting_hr: 52 })];
    const html = renderToStaticMarkup(<DailyHealthCard history={history} today="2026-11-02" />);
    expect(html).not.toContain("<svg");
    expect(html).toContain("Garmin aún no ha sincronizado los datos de hoy.");
  });

  it("con dato de hoy y ≥2 puntos: pinta la tendencia de esa métrica", () => {
    const history = [
      row("2026-11-01", { resting_hr: 52 }),
      row("2026-11-02", { resting_hr: 50 }),
    ];
    const html = renderToStaticMarkup(<DailyHealthCard history={history} today="2026-11-02" />);
    expect(html).toContain("50 ppm");
    expect(html).toContain("Tendencia de FC reposo");
    expect(html).not.toContain("aún no ha sincronizado");
  });
});
