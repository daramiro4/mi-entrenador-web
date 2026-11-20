import type { GarminPreviewContext, GarminWorkoutPreview } from "./garmin";

/** Un bloque de la vista previa con su tiempo total (ya multiplicado por las repeticiones) y su intensidad respecto al FTP de las zonas. */
export interface PreviewBlock {
  label: string;
  reps: number;
  /** Minutos de UNA repetición, como los manda el servicio. */
  minutesEach: number;
  /** Minutos totales del bloque (repeticiones incluidas). */
  minutes: number;
  wattsLow: number | null;
  wattsHigh: number | null;
  pctLow: number | null;
  pctHigh: number | null;
}

export interface PreviewDetail {
  blocks: PreviewBlock[];
  totalMinutes: number;
  /** Potencia media aproximada (punto medio del rango de cada paso, ponderado por tiempo). */
  avgWatts: number | null;
  /** Factor de intensidad aproximado: potencia media / FTP de las zonas. */
  intensityFactor: number | null;
  /** TSS aproximado desde la media (sin potencia normalizada): una estimación para comparar con el planificado, no una medida. */
  estimatedTss: number | null;
}

/** Quita el sufijo de repeticiones; y un único bloque "Intervalo" de una Z2 es en realidad el rodaje continuo. */
function bareLabel(label: string, context: GarminPreviewContext | null): string {
  const bare = label.replace(/\sx\d+$/, "");
  return bare === "Intervalo" && context?.session_type === "z2" ? "Rodaje Z2" : bare;
}

/** "Intervalo x3" → 3 (el servicio añade el sufijo cuando el paso va dentro de un grupo de repeticiones). */
export function repsFromLabel(label: string): number {
  const match = /\sx(\d+)$/.exec(label);
  return match ? Math.max(1, Number(match[1])) : 1;
}

export function describePreviewDetail(preview: GarminWorkoutPreview, context: GarminPreviewContext | null): PreviewDetail {
  const ftp = context?.ftp_watts ?? null;
  const blocks: PreviewBlock[] = preview.steps.map((step) => {
    const reps = repsFromLabel(step.label);
    const low = step.target_low_watts ?? null;
    const high = step.target_high_watts ?? null;
    return {
      label: bareLabel(step.label, context),
      reps,
      minutesEach: step.duration_minutes,
      minutes: step.duration_minutes * reps,
      wattsLow: low,
      wattsHigh: high,
      pctLow: ftp && low != null ? Math.round((low / ftp) * 100) : null,
      pctHigh: ftp && high != null ? Math.round((high / ftp) * 100) : null,
    };
  });

  const totalMinutes = blocks.reduce((sum, b) => sum + b.minutes, 0);
  const powered = blocks.filter((b) => b.wattsLow != null && b.wattsHigh != null);
  const poweredMinutes = powered.reduce((sum, b) => sum + b.minutes, 0);

  let avgWatts: number | null = null;
  let intensityFactor: number | null = null;
  let estimatedTss: number | null = null;
  if (poweredMinutes > 0) {
    const weighted = powered.reduce((sum, b) => sum + ((b.wattsLow! + b.wattsHigh!) / 2) * b.minutes, 0);
    avgWatts = Math.round(weighted / poweredMinutes);
    if (ftp) {
      intensityFactor = Math.round((avgWatts / ftp) * 100) / 100;
      estimatedTss = Math.round((poweredMinutes / 60) * intensityFactor * intensityFactor * 100);
    }
  }
  return { blocks, totalMinutes, avgWatts, intensityFactor, estimatedTss };
}

/** Frases que explican de dónde sale el FTP de las zonas y qué descuentos lleva (para que el usuario sepa por qué esos vatios). */
export function describeFtpBasis(context: GarminPreviewContext): string[] {
  const lines: string[] = [];
  if (context.ftp_watts == null) return lines;
  const SOURCE: Record<NonNullable<GarminPreviewContext["ftp_source"]>, string> = {
    measured: "medido en tu último test",
    provisional: "provisional que indicaste",
    garmin: "estimado por Garmin Connect",
    goal_estimate: "calculado desde tu objetivo (antiguo)",
  };
  const source = context.ftp_source ? SOURCE[context.ftp_source] : null;
  lines.push(`Zonas calculadas sobre ${context.ftp_watts} W${source ? ` (FTP ${source})` : ""}.`);
  if (context.reacclimatization_discount_pct < 0) {
    lines.push(`Incluye ${Math.abs(Math.round(context.reacclimatization_discount_pct * 100))} % de descuento por reaclimatación.`);
  }
  if (context.hr_discount_pct > 0) {
    lines.push(`Incluye −${context.hr_discount_pct} % por pulso (tus últimas Z2 se fueron de pulso).`);
  }
  return lines;
}
