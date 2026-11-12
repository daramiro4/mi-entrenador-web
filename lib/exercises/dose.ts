import type { Dose } from "./catalog";

/** Cuenta atrás de una dosis por tiempo y su anillo (pura: el reloj lo pone el componente). */
export const remainingSeconds = (totalSeconds: number, elapsedMs: number): number => Math.max(0, Math.ceil(totalSeconds - elapsedMs / 1000));

/** Fracción 0..1 que queda por recorrer en el anillo. */
export const ringFraction = (totalSeconds: number, elapsedMs: number): number =>
  totalSeconds <= 0 ? 0 : Math.min(1, Math.max(0, 1 - elapsedMs / (totalSeconds * 1000)));

export const formatClock = (seconds: number): string => {
  const s = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

export const doseSummary = (d: Dose): string => (d.type === "time" ? `${d.seconds} s` : `${d.reps} repeticiones`);
