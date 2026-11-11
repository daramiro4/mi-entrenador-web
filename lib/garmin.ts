import type { ExtraSessionVariant } from "./extra-session";
import type { PlannedSession } from "./types";
import { hrAdjustedFtp } from "./hr-adjustment";
import { resolveBaseFtp } from "./ftp-base";

export interface SendToGarminResult {
  ok: boolean;
  error: string | null;
}

export interface GarminWorkoutStepPreview {
  label: string;
  duration_minutes: number;
  target_low_watts?: number;
  target_high_watts?: number;
  /** Solo en la sesión extra por pulso: número de zona de pulso de Garmin (1-5). */
  target_hr_zone?: number;
}

export interface GarminWorkoutPreview {
  workout_name: string;
  estimated_duration_minutes: number;
  steps: GarminWorkoutStepPreview[];
}

export interface PreviewGarminResult {
  ok: boolean;
  error: string | null;
  preview: GarminWorkoutPreview | null;
}

/** session_type que sí tienen contenido de potencia traducible a un workout de Garmin. */
const GARMIN_SUPPORTED_SESSION_TYPES = new Set(["quality", "z2"]);

type GarminPayloadResult =
  | { ok: true; payload: Record<string, unknown> }
  | { ok: false; error: string };

/** Contexto de FTP de la cuenta para calcular zonas: medido, provisional y descuento por pulso vigente. */
export interface FtpContext {
  measured: number | null;
  provisional: number | null;
  hrDiscountPct: number;
}

function buildGarminPayload(session: PlannedSession, ftp: FtpContext): GarminPayloadResult {
  if (!GARMIN_SUPPORTED_SESSION_TYPES.has(session.session_type)) {
    return { ok: false, error: "Este tipo de sesión no se puede enviar a Garmin." };
  }

  // Las z2 de la ventana de reaclimatación (decisión 5) no llevan planned_tss
  // a propósito -- llevan una duración fija en su lugar (lib/plan-generator.ts).
  const durationMinutes =
    session.session_type === "z2" ? session.notes?.duration_minutes ?? null : null;

  if (session.planned_tss == null && durationMinutes == null) {
    return { ok: false, error: "La sesión no tiene un TSS planificado." };
  }

  // FTP base por fiabilidad (lib/ftp-base.ts): medido > provisional del usuario > legado del objetivo.
  const base = resolveBaseFtp({
    measured: ftp.measured,
    provisional: ftp.provisional,
    sessionType: session.session_type,
    notes: session.notes,
  });

  if (base == null) {
    return {
      ok: false,
      error: "No hay un FTP para calcular las zonas. Indica tu FTP provisional en Ajustes (sirve el que estima Garmin Connect).",
    };
  }
  const effectiveFtpWatts = base.watts;

  // Ajuste por pulso (lib/hr-adjustment.ts): solo Z2, encima del FTP efectivo (que ya trae la reaclimatación).
  const ftpForZones =
    session.session_type === "z2" && ftp.hrDiscountPct > 0
      ? hrAdjustedFtp(effectiveFtpWatts, ftp.hrDiscountPct)
      : effectiveFtpWatts;

  return {
    ok: true,
    payload: {
      date: session.date,
      session_type: session.session_type,
      ftp_watts: ftpForZones,
      ...(session.planned_tss != null
        ? { planned_tss: session.planned_tss }
        : { duration_minutes: durationMinutes }),
    },
  };
}

function getGarminServiceConfig(): { serviceUrl: string; secret: string } | null {
  const serviceUrl = process.env.GARMIN_SEND_SERVICE_URL;
  const secret = process.env.GARMIN_SEND_SECRET;
  if (!serviceUrl || !secret) return null;
  return { serviceUrl, secret };
}

/** POST al servicio de envío de mi-entrenador-garmin (api/send_workout.py). */
async function postToGarminService(
  body: Record<string, unknown>
): Promise<
  | { ok: true; preview: GarminWorkoutPreview | null }
  | { ok: false; error: string }
> {
  const config = getGarminServiceConfig();
  if (!config) {
    return { ok: false, error: "El servicio de envío a Garmin no está configurado." };
  }

  try {
    const response = await fetch(config.serviceUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.secret}`,
      },
      body: JSON.stringify(body),
    });

    const payload = (await response.json()) as {
      ok?: boolean;
      error?: string;
      preview?: GarminWorkoutPreview;
    };

    if (!response.ok || !payload.ok) {
      return { ok: false, error: payload.error ?? `Error del servicio de Garmin (${response.status}).` };
    }

    return { ok: true, preview: payload.preview ?? null };
  } catch (e) {
    // Detalle solo en el log del servidor: el mensaje de red puede revelar hosts o rutas internas.
    console.error("[garmin] fallo de red al contactar con el servicio:", e instanceof Error ? e.message : e);
    return { ok: false, error: "Error de red al contactar con Garmin." };
  }
}

async function previewGarminPayload(payload: Record<string, unknown>): Promise<PreviewGarminResult> {
  const result = await postToGarminService({ ...payload, preview: true });
  if (!result.ok) return { ok: false, error: result.error, preview: null };
  if (!result.preview) {
    return { ok: false, error: "El servicio de Garmin no devolvió la vista previa.", preview: null };
  }
  return { ok: true, error: null, preview: result.preview };
}

async function sendGarminPayload(payload: Record<string, unknown>): Promise<SendToGarminResult> {
  const result = await postToGarminService(payload);
  return result.ok ? { ok: true, error: null } : { ok: false, error: result.error };
}

export async function previewPlannedSessionForGarmin(
  session: PlannedSession,
  ftp: FtpContext
): Promise<PreviewGarminResult> {
  const built = buildGarminPayload(session, ftp);
  if (!built.ok) return { ok: false, error: built.error, preview: null };
  return previewGarminPayload(built.payload);
}

export async function sendPlannedSessionToGarmin(
  session: PlannedSession,
  ftp: FtpContext
): Promise<SendToGarminResult> {
  const built = buildGarminPayload(session, ftp);
  if (!built.ok) return { ok: false, error: built.error };
  return sendGarminPayload(built.payload);
}

/**
 * Sesión extra en el gimnasio (lib/extra-session.ts): por pulso, sin FTP ni
 * TSS — el servicio construye el workout a partir de la variante.
 */
function buildExtraSessionPayload(variant: ExtraSessionVariant, date: string) {
  return { date, session_type: "extra_hr", variant };
}

export async function previewExtraSessionForGarmin(
  variant: ExtraSessionVariant,
  date: string
): Promise<PreviewGarminResult> {
  return previewGarminPayload(buildExtraSessionPayload(variant, date));
}

export async function sendExtraSessionToGarmin(
  variant: ExtraSessionVariant,
  date: string
): Promise<SendToGarminResult> {
  return sendGarminPayload(buildExtraSessionPayload(variant, date));
}
