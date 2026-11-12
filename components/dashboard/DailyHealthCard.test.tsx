import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DailyHealthCard } from "./DailyHealthCard";
import { StatusCard } from "./StatusCard";
import type { DailyMetricsRow, FatigueIndexRow } from "@/lib/types";

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

describe("KPIs de salud", () => {
  it("sin fila de hoy: muestra el último valor con su antigüedad y avisa", () => {
    const html = renderToStaticMarkup(<DailyHealthCard history={history} today="2026-11-02" />);
    expect(html).toContain("11–52");
    expect(html).toContain(">52<");
    expect(html).toContain("ppm");
    expect(html).toContain("ayer");
    expect(html).toContain("hace 2 días"); // el sueño es del 31 oct
    expect(html).toContain("Garmin aún no ha sincronizado los datos de hoy");
    expect(html).not.toContain("<svg"); // pocos puntos: sin tendencia
  });

  it("muestra los cuatro KPIs: Sueño, VFC, FC reposo y Body Battery", () => {
    const html = renderToStaticMarkup(<DailyHealthCard history={history} today="2026-11-02" />);
    for (const label of ["Sueño", "VFC", "FC reposo", "Body Battery"]) expect(html).toContain(label);
    expect(html).not.toContain("Estrés");
  });

  it("con datos de hoy no avisa ni pone antigüedad", () => {
    const h = [row("2026-11-02", { resting_hr: 50, body_battery_min: 20, body_battery_max: 80 })];
    const html = renderToStaticMarkup(<DailyHealthCard history={h} today="2026-11-02" />);
    expect(html).toContain("20–80");
    expect(html).not.toContain("aún no ha sincronizado");
    expect(html).not.toContain("dato de ayer");
  });

  it("pinta la tendencia de 14 días solo con 4 o más puntos", () => {
    const days = ["2026-10-29", "2026-10-30", "2026-10-31", "2026-11-01"];
    const mk = (n: number) => days.slice(-n).map((d, i) => row(d, { resting_hr: 45 + i }));
    expect(renderToStaticMarkup(<DailyHealthCard history={mk(3)} today="2026-11-02" />)).not.toContain("<svg");
    expect(renderToStaticMarkup(<DailyHealthCard history={mk(4)} today="2026-11-02" />)).toContain("Tendencia de FC reposo, últimos 14 días");
  });

  it("la VFC vacía lo dice sin inventar datos", () => {
    const html = renderToStaticMarkup(<DailyHealthCard history={history} today="2026-11-02" />);
    expect(html).toContain("Garmin no está enviando la VFC");
  });

  it("sin ningún dato: mensaje vacío y sin tendencias", () => {
    const html = renderToStaticMarkup(<DailyHealthCard history={[row("2026-11-01")]} today="2026-11-02" />);
    expect(html).toContain("Aún no hay datos de salud sincronizados.");
    expect(html).not.toContain("<svg");
  });
});

describe("Tu estado (anillo de fatiga)", () => {
  const fatigue = (recommendation: string, over: Partial<FatigueIndexRow> = {}): FatigueIndexRow => ({
    id: 1, user_id: "u", date: "2026-11-02", acute_load: 74.39, chronic_load: 59.06, acwr_ratio: 1.26,
    recommendation, notes: null, created_at: "", ...over,
  });

  it("muestra la palabra humana y no el ratio en la vista principal", () => {
    const html = renderToStaticMarkup(<StatusCard fatigueIndex={fatigue("normal")} />);
    expect(html).toContain("Recuperado");
    expect(html).toContain("Carga normal");
    expect(html).toContain("Cuidado"); // leyenda de zonas
    expect(html).toContain("<details"); // el detalle numérico va plegado
    expect(html).toContain("ACWR");
  });

  it("precaución y descanso usan su palabra", () => {
    expect(renderToStaticMarkup(<StatusCard fatigueIndex={fatigue("precaucion")} />)).toContain("Cuidado, vas cargado");
    expect(renderToStaticMarkup(<StatusCard fatigueIndex={fatigue("descanso")} />)).toContain("Necesitas descansar");
  });

  it("sin datos: estado vacío y sin detalle", () => {
    const html = renderToStaticMarkup(<StatusCard fatigueIndex={null} />);
    expect(html).toContain("Sin datos aún");
    expect(html).not.toContain("<details");
  });
});
