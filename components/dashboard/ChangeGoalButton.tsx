"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { archiveAndRestartOnboarding } from "@/app/dashboard/actions";

export function ChangeGoalButton() {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (confirming) {
    return (
      <div className="data-surface rounded-sm p-4 space-y-3">
        <p className="text-sm text-paper">
          Esto archivará tu temporada activa y volverás a pasar por el cuestionario. ¿Seguro?
        </p>
        <div className="flex gap-3">
          <Button
            variant="danger"
            disabled={isPending}
            onClick={() => startTransition(() => archiveAndRestartOnboarding())}
          >
            {isPending ? "Archivando..." : "Sí, cambiar objetivo"}
          </Button>
          <Button variant="ghost" onClick={() => setConfirming(false)} disabled={isPending}>
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button variant="secondary" onClick={() => setConfirming(true)}>
      Cambiar objetivo
    </Button>
  );
}
