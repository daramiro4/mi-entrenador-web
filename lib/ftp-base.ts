import type { PlannedSessionNotes } from "./types";

export const FTP_LIMITS = { min: 80, max: 500 } as const;

export type ProvisionalFtpResult = { ok: true; value: number } | { ok: false; error: string };

/** FTP provisional que escribe el usuario (p. ej. la estimación de Garmin Connect). */
export function validateProvisionalFtp(raw: unknown): ProvisionalFtpResult {
  const n = typeof raw === "string" ? Number(raw.trim().replace(",", ".")) : raw;
  if (typeof n !== "number" || !Number.isFinite(n)) return { ok: false, error: "Escribe un número de vatios." };
  const value = Math.round(n);
  if (value < FTP_LIMITS.min || value > FTP_LIMITS.max) {
    return { ok: false, error: `El FTP debe estar entre ${FTP_LIMITS.min} y ${FTP_LIMITS.max} W.` };
  }
  return { ok: true, value };
}

export type FtpSource = "measured" | "provisional" | "goal_estimate";

export interface BaseFtp {
  watts: number;
  source: FtpSource;
}

/**
 * FTP base con el que se calculan las zonas de una sesión, por orden de fiabilidad:
 *  1. FTP medido (test de rampa). En una z2 de reaclimatación lleva su descuento (`notes.reacclimatization_discount_pct`).
 *  2. FTP provisional del usuario. Es una estimación actual (p. ej. la de Garmin), así que NO lleva descuento de reaclimatación.
 *  3. Legado: `notes.effective_ftp_watts`, calculado en su día a partir del FTP OBJETIVO de la temporada. Solo
 *     se usa si no hay nada mejor: el objetivo no mide la forma actual.
 */
export function resolveBaseFtp(input: {
  measured: number | null;
  provisional: number | null;
  sessionType?: string;
  notes?: PlannedSessionNotes | null;
}): BaseFtp | null {
  if (input.measured != null) {
    const discount = input.sessionType === "z2" ? input.notes?.reacclimatization_discount_pct ?? 0 : 0;
    return { watts: Math.round(input.measured * (1 + Math.min(0, discount))), source: "measured" };
  }
  if (input.provisional != null) return { watts: input.provisional, source: "provisional" };
  const legacy = input.notes?.effective_ftp_watts;
  return legacy != null ? { watts: legacy, source: "goal_estimate" } : null;
}
