import type { FatigueIndexRow } from "./types";

export interface FitnessTrendPoint {
  date: string;
  fitness: number;
  fatigue: number;
  forma: number;
}

/**
 * Filas de fatigue_index -> puntos del gráfico Fitness/Fatiga/Forma
 * (equivalente al PMC de TrainingPeaks / Training Status de Garmin).
 * Descarta filas sin acute_load/chronic_load — no se puede calcular "forma".
 */
export function buildFitnessTrendPoints(rows: FatigueIndexRow[]): FitnessTrendPoint[] {
  const points: FitnessTrendPoint[] = [];

  for (const row of rows) {
    if (row.chronic_load == null || row.acute_load == null) continue;
    points.push({
      date: row.date,
      fitness: row.chronic_load,
      fatigue: row.acute_load,
      forma: row.chronic_load - row.acute_load,
    });
  }

  return points;
}

/** Menos de `minDays` puntos válidos dibuja una tendencia engañosa — mejor mostrar un estado vacío. */
export function hasEnoughTrendData(points: FitnessTrendPoint[], minDays = 7): boolean {
  return points.length >= minDays;
}
