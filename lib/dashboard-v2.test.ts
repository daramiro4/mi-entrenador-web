import { describe, expect, it } from "vitest";
import {
  adaptationPhrase,
  buildFtpSeries,
  buildHrvChart,
  deltaVsAverage,
  FATIGUE_ARC_FILL,
  fatigueView,
  hrvBand,
  hrvStatus,
  hrvSubtitle,
  lastValues,
  NEXT_TEST_WEEKS,
  seasonPillLabel,
} from "./dashboard-v2";
import { addDays } from "./week";

describe("fatigueView", () => {
  it("normal = Volt/Recuperado, precaución = Ember, descanso = Fatiga", () => {
    expect(fatigueView("normal")).toMatchObject({ word: "Recuperado", subtext: "Carga normal", color: "var(--volt)", fill: 0.75, zoneIndex: 0 });
    expect(fatigueView("precaucion")).toMatchObject({ word: "Cuidado, vas cargado", color: "var(--accent)", fill: 0.45, zoneIndex: 1 });
    expect(fatigueView("descanso")).toMatchObject({ word: "Necesitas descansar", color: "var(--danger)", fill: 0.2, zoneIndex: 2 });
    expect(fatigueView(null)).toBeNull();
  });
  it("los rellenos son decrecientes con la gravedad", () => {
    expect(FATIGUE_ARC_FILL.normal).toBeGreaterThan(FATIGUE_ARC_FILL.precaucion);
    expect(FATIGUE_ARC_FILL.precaucion).toBeGreaterThan(FATIGUE_ARC_FILL.descanso);
  });
});

describe("seasonPillLabel", () => {
  it("objetivo con y sin fecha", () => {
    expect(seasonPillLabel("ftp_improvement", null)).toBe("Mejora de FTP");
    expect(seasonPillLabel("event_prep", "2027-03-15")).toBe("Preparación de evento · 15/03/2027");
    expect(seasonPillLabel("maintenance", null)).toBe("Mantenimiento");
  });
});

describe("adaptationPhrase", () => {
  const z2 = { status: "planned" as const, session_type: "z2" as const };
  it("degradada, descuento por pulso, precaución y sin cambios", () => {
    expect(adaptationPhrase({ session: { ...z2, status: "degraded" }, recommendation: "normal", hrDiscountPct: 0 })).toMatch(/Adaptada/);
    expect(adaptationPhrase({ session: z2, recommendation: "normal", hrDiscountPct: 15 })).toMatch(/−15 %/);
    expect(adaptationPhrase({ session: z2, recommendation: "precaucion", hrDiscountPct: 0 })).toMatch(/precaución/);
    expect(adaptationPhrase({ session: z2, recommendation: "normal", hrDiscountPct: 0 })).toMatch(/Sin cambios/);
  });
  it("sin sesión, descanso o ya resuelta: nada", () => {
    expect(adaptationPhrase({ session: null, recommendation: "normal", hrDiscountPct: 0 })).toBeNull();
    expect(adaptationPhrase({ session: { status: "planned", session_type: "rest" }, recommendation: "normal", hrDiscountPct: 0 })).toBeNull();
    expect(adaptationPhrase({ session: { ...z2, status: "done" }, recommendation: "normal", hrDiscountPct: 0 })).toBeNull();
  });
});

describe("KPIs", () => {
  const rows = Array.from({ length: 20 }, (_, i) => ({ date: addDays("2026-11-01", i), v: i < 18 ? 50 + i : null }));
  it("lastValues toma los últimos 14 días sin nulos, ascendente", () => {
    const v = lastValues(rows, (r) => r.v, "2026-11-20", 14);
    expect(v.length).toBeLessThanOrEqual(14);
    expect(v).toEqual([...v].sort((a, b) => a - b));
  });
  it("deltaVsAverage: último frente a la media anterior", () => {
    expect(deltaVsAverage([10, 10, 10, 16])).toBe(6);
    expect(deltaVsAverage([10, 12])).toBeNull();
  });
});

describe("VFC contra tu normal", () => {
  it("banda = media ± 0,5 DE sobre ln, devuelta con exp", () => {
    const values = [50, 60, 55, 65, 45, 58, 52, 62, 48, 57, 54, 61, 49, 56];
    const band = hrvBand(values)!;
    const logs = values.map(Math.log);
    const mean = logs.reduce((a, b) => a + b, 0) / logs.length;
    const sd = Math.sqrt(logs.reduce((a, b) => a + (b - mean) ** 2, 0) / (logs.length - 1));
    expect(band.mean).toBeCloseTo(Math.exp(mean), 6);
    expect(band.low).toBeCloseTo(Math.exp(mean - 0.5 * sd), 6);
    expect(band.high).toBeCloseTo(Math.exp(mean + 0.5 * sd), 6);
    expect(band.low).toBeLessThan(band.mean);
    expect(band.high).toBeGreaterThan(band.mean);
  });
  it("estado de la media de 7 días", () => {
    const band = { low: 50, high: 60 };
    expect(hrvStatus(45, band)).toBe("por debajo");
    expect(hrvStatus(55, band)).toBe("dentro");
    expect(hrvStatus(65, band)).toBe("por encima");
    expect(hrvStatus(null, band)).toBeNull();
    expect(hrvSubtitle("dentro")).toBe("La media de 7 días está dentro de tu rango normal.");
  });
  it("menos de 14 días con dato: estado vacío, sin banda", () => {
    const rows = Array.from({ length: 10 }, (_, i) => ({ date: addDays("2026-11-01", i), hrv_ms: 55 + i }));
    const chart = buildHrvChart(rows, "2026-11-10", 60);
    expect(chart.enough).toBe(false);
    expect(chart.band).toBeNull();
    expect(chart.status).toBeNull();
  });
  it("con datos suficientes calcula banda, media móvil y estado; el periodo fija el nº de puntos", () => {
    const rows = Array.from({ length: 60 }, (_, i) => ({ date: addDays("2026-09-12", i), hrv_ms: 55 + (i % 5) }));
    const chart = buildHrvChart(rows, "2026-11-10", 30);
    expect(chart.enough).toBe(true);
    expect(chart.points).toHaveLength(30);
    expect(chart.band).not.toBeNull();
    expect(chart.latestMa7).not.toBeNull();
    expect(chart.status).toBe("dentro");
  });
  it("sin ningún dato de VFC (como hoy en Garmin) es estado vacío", () => {
    const rows = [{ date: "2026-11-09", hrv_ms: null }];
    expect(buildHrvChart(rows, "2026-11-10", 60).enough).toBe(false);
  });
});

describe("buildFtpSeries", () => {
  const history = [
    { date: "2026-06-01", ftp_watts: 200 },
    { date: "2026-08-10", ftp_watts: 214.4 },
  ];
  it("ordena, redondea, prolonga hasta hoy y sitúa el próximo test a +5 semanas del último", () => {
    const s = buildFtpSeries([...history].reverse(), "2026-11-10");
    expect(s.points.map((p) => p.ftp)).toEqual([200, 214]);
    expect(s.stepEnd).toEqual({ date: "2026-11-10", ftp: 214 });
    expect(s.nextTest).toEqual({ date: addDays("2026-08-10", NEXT_TEST_WEEKS * 7), ftp: 214 });
  });
  it("sin historial no hay nada que dibujar", () => {
    expect(buildFtpSeries([], "2026-11-10")).toEqual({ points: [], stepEnd: null, nextTest: null });
  });
  it("si el último test es de hoy no hay tramo de prolongación", () => {
    expect(buildFtpSeries([{ date: "2026-11-10", ftp_watts: 220 }], "2026-11-10").stepEnd).toBeNull();
  });
});
