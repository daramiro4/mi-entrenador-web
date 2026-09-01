"use client";

import { useEffect, useTransition } from "react";
import { ensureCurrentWeekGeneratedAction } from "@/app/dashboard/weekly-close-actions";
import { ensureActivityMatchesAction } from "@/app/dashboard/activity-matching-actions";
import { ensureDailyAdaptationAction } from "@/app/dashboard/daily-adaptation-actions";

/**
 * Sincroniza el dashboard al montar, en tres pasos SECUENCIALES (no en
 * paralelo): 1) asegura que la semana de hoy exista (decisión 1) — genera la
 * narrativa de la semana que cerró de paso (decisión 7); 2) empareja
 * actividades reales de Garmin con sesiones planificadas; 3) aplica la capa
 * diaria adaptativa (decisión 4) a la sesión de hoy.
 *
 * El orden 2→3 es a propósito: si una actividad real ya completó la sesión
 * de hoy, debe marcarse `done` ANTES de que la capa adaptativa decida si
 * degradarla — si corrieran en paralelo (como antes, con dos componentes de
 * efecto separados), habría una condición de carrera real entre "ya lo
 * hiciste" y "hoy vas cargado, lo degrado". `ensureDailyAdaptationAction` ya
 * se salta cualquier sesión que no siga en `planned`, así que basta con
 * garantizar que el paso 2 termine de escribir antes de que empiece el 3.
 *
 * Server Actions desde un efecto de cliente, nunca escrituras durante el
 * render del Server Component (mismo motivo en las tres piezas). No
 * renderiza nada; cada acción llama a `revalidatePath` si cambió algo.
 */
export function DashboardSyncEffect() {
  const [, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      await ensureCurrentWeekGeneratedAction();
      await ensureActivityMatchesAction();
      await ensureDailyAdaptationAction();
    });
  }, []);

  return null;
}
