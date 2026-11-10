"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { createPortal } from "react-dom";
import {
  previewPlannedSessionToGarminAction,
  sendPlannedSessionToGarminAction,
} from "@/app/dashboard/garmin-actions";
import type { GarminWorkoutPreview } from "@/lib/garmin";

const subscribeNoop = () => () => {};

type Mode = "idle" | "previewing" | "sent";

export function SendToGarminButton({ plannedSessionId }: { plannedSessionId: string }) {
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
    return <span className="text-[9px] text-volt">Enviado ✓</span>;
  }

  return (
    <div className="flex flex-col items-center gap-0.5">
      <button
        type="button"
        onClick={handlePreviewClick}
        disabled={isPending}
        className="text-[9px] text-fog hover:text-paper underline disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
      >
        {isPending && mode === "idle" ? "Cargando..." : "Enviar a Garmin"}
      </button>
      {error && <span className="text-[9px] text-fatiga text-center">{error}</span>}

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
              className="data-surface w-full max-w-sm max-h-[85dvh] overflow-y-auto p-4 space-y-3 text-left shadow-lg"
            >
              <div>
                <p className="text-sm text-paper font-semibold">{preview.workout_name}</p>
                <p className="text-[11px] text-fog">
                  {preview.estimated_duration_minutes} min en total
                </p>
              </div>
              <ul className="space-y-1">
                {preview.steps.map((step, index) => (
                  <li key={index} className="text-xs text-paper">
                    {step.label} · {step.duration_minutes} min
                    {step.target_low_watts != null &&
                      ` · ${step.target_low_watts}-${step.target_high_watts} W`}
                  </li>
                ))}
              </ul>
              {error && <p className="text-xs text-fatiga">{error}</p>}
              <div className="flex gap-4 pt-1 pb-[env(safe-area-inset-bottom)]">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleConfirm}
                  className="text-sm text-volt hover:text-paper underline disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  {isPending ? "Enviando..." : "Confirmar envío"}
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleCancel}
                  className="text-sm text-fog hover:text-paper underline disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
