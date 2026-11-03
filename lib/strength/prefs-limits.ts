/**
 * Duración de sesión admitida. Con 60 min ningún formato llega a la duración pedida (los topes de
 * rondas/volumen de `formats.ts` dan 23–42 min) y el validador rechaza la rutina; por eso el máximo es 45.
 */
export const SESSION_MINUTE_OPTIONS = [20, 30, 45] as const;
export const MIN_SESSION_MINUTES = 15;
export const MAX_SESSION_MINUTES = 45;

export function clampSessionMinutes(n: number): number {
  if (!Number.isFinite(n)) return SESSION_MINUTE_OPTIONS[1];
  return Math.min(MAX_SESSION_MINUTES, Math.max(MIN_SESSION_MINUTES, Math.round(n)));
}
