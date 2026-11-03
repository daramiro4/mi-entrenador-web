/**
 * Duración de sesión admitida para "Fuerza completa" (5-7 ejercicios × 3 series con descanso de
 * 60-120 s): de 30 a 60 min. Con menos de 30 min no caben los grupos musculares básicos con 3 series.
 */
export const SESSION_MINUTE_OPTIONS = [30, 45, 60] as const;
export const MIN_SESSION_MINUTES = 30;
export const MAX_SESSION_MINUTES = 60;

export function clampSessionMinutes(n: number): number {
  if (!Number.isFinite(n)) return SESSION_MINUTE_OPTIONS[1];
  return Math.min(MAX_SESSION_MINUTES, Math.max(MIN_SESSION_MINUTES, Math.round(n)));
}
