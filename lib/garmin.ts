import type { PlannedSession } from "./types";

export interface SendToGarminResult {
  ok: boolean;
  error: string | null;
}

export interface GarminWorkoutStepPreview {
  label: string;
  duration_minutes: number;
  target_low_watts?: number;
  target_high_watts?: number;
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

function buildGarminPayload(
  session: PlannedSession,
  ftpWatts: number | null
): GarminPayloadResult {
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

  // Si aún no hay ningún ftp_history medido, se usa el FTP efectivo ya
  // descontado que el generador guardó en notes (solo aplica a la ventana
  // de reaclimatización).
  const effectiveFtpWatts = ftpWatts ?? session.notes?.effective_ftp_watts ?? null;

  if (effectiveFtpWatts == null) {
    return { ok: false, error: "No hay un FTP registrado para calcular las zonas de potencia." };
  }

  return {
    ok: true,
    payload: {
      date: session.date,
      session_type: session.session_type,
      ftp_watts: effectiveFtpWatts,
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

export async function previewPlannedSessionForGarmin(
  session: PlannedSession,
  ftpWatts: number | null
): Promise<PreviewGarminResult> {
  const built = buildGarminPayload(session, ftpWatts);
  if (!built.ok) return { ok: false, error: built.error, preview: null };

  const config = getGarminServiceConfig();
  if (!config) {
    return { ok: false, error: "El servicio de envío a Garmin no está configurado.", preview: null };
  }

  try {
    const response = await fetch(config.serviceUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.secret}`,
      },
      body: JSON.stringify({ ...built.payload, preview: true }),
    });

    const payload = (await response.json()) as {
      ok?: boolean;
      error?: string;
      preview?: GarminWorkoutPreview;
    };

    if (!response.ok || !payload.ok || !payload.preview) {
      return {
        ok: false,
        error: payload.error ?? `Error del servicio de Garmin (${response.status}).`,
        preview: null,
      };
    }

    return { ok: true, error: null, preview: payload.preview };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error de red al contactar con Garmin.",
      preview: null,
    };
  }
}

export async function sendPlannedSessionToGarmin(
  session: PlannedSession,
  ftpWatts: number | null
): Promise<SendToGarminResult> {
  const built = buildGarminPayload(session, ftpWatts);
  if (!built.ok) return { ok: false, error: built.error };

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
      body: JSON.stringify(built.payload),
    });

    const payload = (await response.json()) as { ok?: boolean; error?: string };

    if (!response.ok || !payload.ok) {
      return { ok: false, error: payload.error ?? `Error del servicio de Garmin (${response.status}).` };
    }

    return { ok: true, error: null };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error de red al contactar con Garmin." };
  }
}
