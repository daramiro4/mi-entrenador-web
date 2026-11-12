import type { FtpHistoryRow, PlannedSession, SessionType } from "./types";
import type { HrvRow } from "./dashboard-v2";
import { addDays, getMondayOfWeek } from "./week";

/**
 * Datos de EJEMPLO para `?demo=1` (solo fuera de producción). Se usan únicamente en las secciones que no tienen
 * datos reales. Nunca se escriben en la base de datos.
 */

// Semana tipo: Z2 suave, VO2max, Fuerza, Z2 media (hoy), Descanso, Sesión larga, Fuerza.
const TYPICAL_WEEK: { type: SessionType; tss: number | null; minutes: number | null }[] = [
  { type: "z2", tss: 45, minutes: 60 }, // Z2 suave
  { type: "quality", tss: 75, minutes: 60 }, // VO2max
  { type: "strength", tss: 25, minutes: 45 }, // Fuerza
  { type: "z2", tss: 60, minutes: 75 }, // Z2 media
  { type: "rest", tss: null, minutes: null }, // Descanso
  { type: "z2", tss: 110, minutes: 150 }, // Sesión larga
  { type: "strength", tss: 25, minutes: 45 }, // Fuerza
];

export function demoWeek(today: string): PlannedSession[] {
  const monday = getMondayOfWeek(today);
  return TYPICAL_WEEK.map((d, i) => {
    const date = addDays(monday, i);
    return {
      id: `demo-${i}`,
      user_id: "demo",
      season_id: 0,
      date,
      workout_template_id: null,
      session_type: d.type,
      planned_tss: d.tss,
      status: date < today && d.type !== "rest" ? "done" : "planned",
      actual_activity_id: null,
      notes: d.minutes != null ? { duration_minutes: d.minutes } : null,
      created_at: "",
      updated_at: "",
    } as PlannedSession;
  });
}

export const DEMO_NARRATIVE =
  "Semana sólida: llevas casi todo el TSS previsto y has respetado los días de descanso. El pulso en tus Z2 bajó respecto a la semana pasada, buena señal. Esta semana toca consolidar: prioriza dormir y mantén la sesión larga en Z2.";

// PRNG determinista para que los datos de ejemplo no cambien entre recargas.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function demoHrv(today: string, days = 400): HrvRow[] {
  const rand = mulberry32(42);
  return Array.from({ length: days }, (_, i) => {
    const date = addDays(today, -(days - 1 - i));
    const trend = 58 + 4 * Math.sin(i / 25);
    const noise = (rand() - 0.5) * 14;
    // Algún día sin dato, como pasa en la vida real.
    return { date, hrv_ms: rand() < 0.08 ? null : Math.round(trend + noise) };
  });
}

export function demoFtpHistory(today: string): Pick<FtpHistoryRow, "date" | "ftp_watts">[] {
  return [
    { date: addDays(today, -230), ftp_watts: 196 },
    { date: addDays(today, -155), ftp_watts: 204 },
    { date: addDays(today, -80), ftp_watts: 212 },
    { date: addDays(today, -22), ftp_watts: 218 },
  ];
}
