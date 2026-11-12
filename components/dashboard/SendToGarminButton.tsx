"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";
import {
  previewPlannedSessionToGarminAction,
  sendPlannedSessionToGarminAction,
} from "@/app/dashboard/garmin-actions";
import { Button } from "@/components/ui/Button";
import type { GarminWorkoutPreview } from "@/lib/garmin";

const subscribeNoop = () => () => {};

type Mode = "idle" | "previewing" | "sent";

/**
 * "Enviar a Garmin": vista previa en un panel fijo (portal a <body>, no lo tapa el calendario) y confirmación.
 * `variant="primary"` es el botón principal de la vista (uno solo); `secondary` para el resto.
 */
export function SendToGarminButton({
  plannedSessionId,
  variant = "secondary",
  disabled = false,
}: {
  plannedSessionId: string;
  variant?: "primary" | "secondary";
  disabled?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<Mode>("idle");
  const [preview, setPreview] = useState<GarminWorkoutPreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Portal a <body>: el globo no puede quedar tapado por el contexto de apilamiento de la celda del día.
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);

  const handlePreviewClick = () => {
    setError(null);
    startTransition(async () => {
      const outcome = await previewPlannedSessionToGarminAction(plannedSessionId);
      if (!outcome.ok || !outcome.preview) {
        setError(outcome.error);
        return;
      }
      setPreview(outcome.preview);
      setMode("previewing");
    });
  };

  const handleConfirm = () => {
    setError(null);
    startTransition(async () => {
      const outcome = await sendPlannedSessionToGarminAction(plannedSessionId);
      if (!outcome.ok) {
        setError(outcome.error);
        return;
      }
      setMode("sent");
    });
  };

  const handleCancel = () => {
    setPreview(null);
    setError(null);
    setMode("idle");
  };

  if (mode === "sent") {
    return (
      <span className="inline-flex min-h-11 items-center gap-2 px-2 text-sm text-accent" role="status">
        <Check size={16} aria-hidden="true" /> Enviada al reloj
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        variant={variant === "primary" ? "primary" : "secondary"}
        onClick={handlePreviewClick}
        disabled={isPending || disabled}
      >
        {isPending && mode === "idle" ? "Cargando..." : "Enviar a Garmin"}
      </Button>
      {error && mode === "idle" && <span className="text-sm text-danger">{error}</span>}

      {mode === "previewing" && preview && mounted &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-3 sm:items-center"
            onClick={() => !isPending && handleCancel()}
            role="presentation"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Vista previa del entreno para Garmin"
              onClick={(e) => e.stopPropagation()}
              className="data-surface max-h-[85dvh] w-full max-w-sm space-y-3 overflow-y-auto p-4 text-left"
            >
              <div>
                <p className="font-display text-2xl">{preview.workout_name}</p>
                <p className="font-mono text-xs text-label-2">{preview.estimated_duration_minutes} min en total</p>
              </div>
              <ul className="space-y-1">
                {preview.steps.map((step, index) => (
                  <li key={index} className="text-sm">
                    {step.label} · <span className="font-mono">{step.duration_minutes} min</span>
                    {step.target_low_watts != null && (
                      <span className="font-mono">{` · ${step.target_low_watts}-${step.target_high_watts} W`}</span>
                    )}
                  </li>
                ))}
              </ul>
              {error && <p className="text-sm text-danger">{error}</p>}
              <div className="flex flex-wrap gap-2 pt-1 pb-[env(safe-area-inset-bottom)]">
                <Button type="button" disabled={isPending} onClick={handleConfirm}>
                  {isPending ? "Enviando..." : "Confirmar envío"}
                </Button>
                <Button type="button" variant="ghost" disabled={isPending} onClick={handleCancel}>
                  Cancelar
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
