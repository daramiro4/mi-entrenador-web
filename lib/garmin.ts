import type { PlannedSession } from "./types";

export interface SendToGarminResult {
  ok: boolean;
  error: string | null;
}

/** session_type que sí tienen contenido de potencia traducible a un workout de Garmin. */
const GARMIN_SUPPORTED_SESSION_TYPES = new Set(["quality", "z2"]);

export async function sendPlannedSessionToGarmin(
  session: PlannedSession,
  ftpWatts: number | null
): Promise<SendToGarminResult> {
  if (!GARMIN_SUPPORTED_SESSION_TYPES.has(session.session_type)) {
    return { ok: false, error: "Este tipo de sesión no se puede enviar a Garmin." };
  }

  if (session.planned_tss == null) {
    return { ok: false, error: "La sesión no tiene un TSS planificado." };
  }

  if (ftpWatts == null) {
    return { ok: false, error: "No hay un FTP registrado para calcular las zonas de potencia." };
  }

  const serviceUrl = process.env.GARMIN_SEND_SERVICE_URL;
  const secret = process.env.GARMIN_SEND_SECRET;

  if (!serviceUrl || !secret) {
    return { ok: false, error: "El servicio de envío a Garmin no está configurado." };
  }

  try {
    const response = await fetch(serviceUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({
        date: session.date,
        session_type: session.session_type,
        planned_tss: session.planned_tss,
        ftp_watts: ftpWatts,
      }),
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
