import { describe, expect, it } from "vitest";
import type { GarminPreviewContext, GarminWorkoutPreview } from "./garmin";
import { describeFtpBasis, describePreviewDetail, repsFromLabel } from "./garmin-preview-detail";

const ctx = (over: Partial<GarminPreviewContext> = {}): GarminPreviewContext => ({
  date: "2026-11-20",
  session_type: "quality",
  planned_tss: 80,
  duration_minutes: null,
  ftp_watts: 200,
  ftp_source: "measured",
  reacclimatization_discount_pct: 0,
  hr_discount_pct: 0,
  ...over,
});

describe("repsFromLabel", () => {
  it("lee el sufijo xN y por defecto es 1", () => {
    expect(repsFromLabel("Intervalo x3")).toBe(3);
    expect(repsFromLabel("Calentamiento")).toBe(1);
  });
});

describe("describePreviewDetail", () => {
  const preview: GarminWorkoutPreview = {
    workout_name: "Calidad 2026-11-20",
    estimated_duration_minutes: 54,
    steps: [
      { label: "Calentamiento", duration_minutes: 10, target_low_watts: 110, target_high_watts: 130 },
      { label: "Intervalo x3", duration_minutes: 8, target_low_watts: 190, target_high_watts: 210 },
      { label: "Recuperación x3", duration_minutes: 4, target_low_watts: 100, target_high_watts: 120 },
      { label: "Enfriamiento", duration_minutes: 8, target_low_watts: 100, target_high_watts: 120 },
    ],
  };

  it("multiplica por repeticiones y calcula %FTP, media, IF y TSS", () => {
    const d = describePreviewDetail(preview, ctx());
    expect(d.blocks.map((b) => b.minutes)).toEqual([10, 24, 12, 8]);
    expect(d.totalMinutes).toBe(54);
    expect(d.blocks[1]).toMatchObject({ label: "Intervalo", reps: 3, minutesEach: 8, pctLow: 95, pctHigh: 105 });
    // media ponderada: (120*10 + 200*24 + 110*12 + 110*8) / 54 = 151,85 → 152 W; IF = 152/200 = 0,76
    expect(d.avgWatts).toBe(Math.round((120 * 10 + 200 * 24 + 110 * 12 + 110 * 8) / 54));
    expect(d.intensityFactor).toBe(0.76);
    expect(d.estimatedTss).toBe(Math.round((54 / 60) * 0.76 * 0.76 * 100));
  });

  it("un único bloque Intervalo de una Z2 se llama Rodaje Z2", () => {
    const z2: GarminWorkoutPreview = {
      workout_name: "Z2",
      estimated_duration_minutes: 60,
      steps: [{ label: "Intervalo", duration_minutes: 60, target_low_watts: 130, target_high_watts: 150 }],
    };
    expect(describePreviewDetail(z2, ctx({ session_type: "z2" })).blocks[0].label).toBe("Rodaje Z2");
  });

  it("sin contexto (sin FTP) no inventa porcentajes ni TSS", () => {
    const d = describePreviewDetail(preview, null);
    expect(d.blocks[1].pctLow).toBeNull();
    expect(d.intensityFactor).toBeNull();
    expect(d.estimatedTss).toBeNull();
    expect(d.avgWatts).not.toBeNull();
  });
});

describe("describeFtpBasis", () => {
  it("explica el origen del FTP y los descuentos aplicados", () => {
    const lines = describeFtpBasis(
      ctx({ session_type: "z2", ftp_watts: 181, ftp_source: "measured", reacclimatization_discount_pct: -0.15, hr_discount_pct: 8 }),
    );
    expect(lines[0]).toContain("181 W");
    expect(lines[0]).toContain("medido");
    expect(lines.join(" ")).toContain("15 % de descuento por reaclimatación");
    expect(lines.join(" ")).toContain("−8 % por pulso");
  });

  it("sin descuentos solo da la línea del FTP", () => {
    expect(describeFtpBasis(ctx({ ftp_source: "provisional" }))).toHaveLength(1);
  });
});
