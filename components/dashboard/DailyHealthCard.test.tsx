import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DailyHealthCard } from "./DailyHealthCard";
import { StatusCard } from "./StatusCard";
import type { DailyMetricsRow } from "@/lib/types";

function row(date: string, over: Partial<DailyMetricsRow> = {}): DailyMetricsRow {
  return {
    id: 1, user_id: "u", date, created_at: "", source: "garmin",
    sleep_score: null, sleep_duration_minutes: null, stress_avg: null, hrv_ms: null,
    resting_hr: null, body_battery_max: null, body_battery_min: null, weight_kg: null, body_fat_pct: null,
    ...over,
  };
}

const history = [
  row("2026-10-31", { sleep_score: 89, resting_hr: 46, body_battery_min: 7, body_battery_max: 91 }),
  row("2026-11-01", { resting_hr: 52, body_battery_min: 11, body_battery_max: 52 }),
];

describe("tarjetas de salud: misma regla (último valor disponible)", () => {
  it("Salud de hoy sin fila de hoy: muestra el último valor con su antigüedad y avisa", () => {
    const html = renderToStaticMarkup(<DailyHealthCard history={history} today="2026-11-02" />);
    expect(html).toContain("11–52");
    expect(html).toContain("52 ppm");
    expect(html).toContain("ayer");
    expect(html).toContain("hace 2 días"); // el sueño es del 31 oct
    expect(html).toContain("Garmin aún no ha sincronizado los datos de hoy");
    expect(html).toContain("Tendencia de FC reposo");
  });

  it("Tu estado y Salud de hoy muestran el mismo Body Battery", () => {
    const status = renderToStaticMarkup(<StatusCard fatigueIndex={null} history={history} today="2026-11-02" />);
    const health = renderToStaticMarkup(<DailyHealthCard history={history} today="2026-11-02" />);
    expect(status).toContain("11–52");
    expect(health).toContain("11–52");
  });

  it("con datos de hoy no avisa ni pone antigüedad", () => {
    const h = [row("2026-11-02", { resting_hr: 50, body_battery_min: 20, body_battery_max: 80 })];
    const html = renderToStaticMarkup(<DailyHealthCard history={h} today="2026-11-02" />);
    expect(html).toContain("20–80");
    expect(html).not.toContain("aún no ha sincronizado");
    expect(html).not.toContain("ayer");
  });

  it("sin ningún dato: mensaje vacío y sin tendencias", () => {
    const html = renderToStaticMarkup(<DailyHealthCard history={[row("2026-11-01")]} today="2026-11-02" />);
    expect(html).toContain("Aún no hay datos de salud sincronizados.");
    expect(html).not.toContain("<svg");
  });
});
