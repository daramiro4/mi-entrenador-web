/**
 * Minutos de EJERCICIOS por sesión para "Fuerza completa": de 30 a 45 min (5-6 ejercicios × 3 series con descanso de 90-120 s).
 * A estos se suman 10 min de cardio en cinta de activación (ENGINE.CARDIO_MIN): la sesión completa dura unos 40-56 min.
 * 60 min ya no cabe: 6 ejercicios de 3 series no llegan a esa duración (y la sesión se hacía larga).
 */
export const SESSION_MINUTE_OPTIONS = [30, 45] as const;
export const MIN_SESSION_MINUTES = 30;
export const MAX_SESSION_MINUTES = 45;

export function clampSessionMinutes(n: number): number {
  if (!Number.isFinite(n)) return MAX_SESSION_MINUTES;
  return Math.min(MAX_SESSION_MINUTES, Math.max(MIN_SESSION_MINUTES, Math.round(n)));
}
