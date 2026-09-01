"use client";

import { useEffect, useTransition } from "react";
import { ensureDailyAdaptationAction } from "@/app/dashboard/daily-adaptation-actions";

/**
 * Dispara la capa diaria adaptativa (decisión 4) al montar el dashboard, vía
 * Server Action desde un efecto de cliente — no una escritura en el render
 * del Server Component (mismo motivo que en pieza 2: evita mutar durante un
 * GET y condiciones de carrera entre renders concurrentes). No renderiza
 * nada; si hace algún cambio, `revalidatePath` dentro de la acción refresca
 * la página con los datos ya adaptados.
 */
export function DailyAdaptationEffect() {
  const [, startTransition] = useTransition();

  useEffect(() => {
    startTransition(() => {
      ensureDailyAdaptationAction();
    });
  }, []);

  return null;
}
