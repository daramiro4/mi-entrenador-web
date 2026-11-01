"use client";

import { Watch } from "lucide-react";
import { Button } from "@/components/ui/Button";

/** Placeholder hasta la Fase 9: con el interruptor apagado muestra "Próximamente". */
export function SendToForerunner({ workoutId }: { workoutId: string }) {
  void workoutId;
  return (
    <Button variant="secondary" disabled aria-label="Enviar al Forerunner (próximamente)">
      <Watch size={18} strokeWidth={1.75} aria-hidden="true" className="mr-2" />
      Enviar al Forerunner · Próximamente
    </Button>
  );
}
