export interface SyncGarminResult {
  ok: boolean;
  error: string | null;
  date: string | null;
  activitiesSynced: number | null;
  fatigue: { acwrRatio: number | null; recommendation: string | null } | null;
}

function getGarminSyncConfig(): { serviceUrl: string; secret: string } | null {
  const serviceUrl = process.env.GARMIN_SYNC_SERVICE_URL;
  // Reutiliza el mismo secreto que ya protege api/send_workout.py -- ambos
  // endpoints viven en el mismo proyecto Vercel de mi-entrenador-garmin.
  const secret = process.env.GARMIN_SEND_SECRET;
  if (!serviceUrl || !secret) return null;
  return { serviceUrl, secret };
}

export async function triggerGarminSync(): Promise<SyncGarminResult> {
  const config = getGarminSyncConfig();
  if (!config) {
    return {
      ok: false,
      error: "El servicio de sincronización con Garmin no está configurado.",
      date: null,
      activitiesSynced: null,
      fatigue: null,
    };
  }

  try {
    const response = await fetch(config.serviceUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${config.secret}` },
    });

    const payload = (await response.json()) as {
      ok?: boolean;
      error?: string;
      date?: string;
      activities_synced?: number;
      fatigue?: { acwr_ratio: number | null; recommendation: string | null } | null;
    };

    if (!response.ok || !payload.ok) {
      return {
        ok: false,
        error: payload.error ?? `Error del servicio de Garmin (${response.status}).`,
        date: null,
        activitiesSynced: null,
        fatigue: null,
      };
    }

    return {
      ok: true,
      error: null,
      date: payload.date ?? null,
      activitiesSynced: payload.activities_synced ?? null,
      fatigue: payload.fatigue
        ? {
            acwrRatio: payload.fatigue.acwr_ratio,
            recommendation: payload.fatigue.recommendation,
          }
        : null,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error de red al contactar con Garmin.",
      date: null,
      activitiesSynced: null,
      fatigue: null,
    };
  }
}
