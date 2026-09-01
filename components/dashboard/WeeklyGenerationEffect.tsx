"use client";

import { useEffect, useTransition } from "react";
import { ensureCurrentWeekGeneratedAction } from "@/app/dashboard/weekly-close-actions";

/**
 * Decisión 1 simplificada: al montar el dashboard, asegura que la semana de
 * hoy tenga plan generado (genera solo esa semana si hace falta, nunca el
 * macrociclo). Mismo patrón que DailyAdaptationEffect — Server Action desde
 * un efecto de cliente, no una escritura durante el render.
 */
export function WeeklyGenerationEffect() {
  const [, startTransition] = useTransition();

  useEffect(() => {
    startTransition(() => {
      ensureCurrentWeekGeneratedAction();
    });
  }, []);

  return null;
}
