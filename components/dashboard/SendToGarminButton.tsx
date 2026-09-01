"use client";

import { useState, useTransition } from "react";
import {
  previewPlannedSessionToGarminAction,
  sendPlannedSessionToGarminAction,
} from "@/app/dashboard/garmin-actions";
import type { GarminWorkoutPreview } from "@/lib/garmin";

type Mode = "idle" | "previewing" | "sent";

export function SendToGarminButton({ plannedSessionId }: { plannedSessionId: string }) {
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<Mode>("idle");
  const [preview, setPreview] = useState<GarminWorkoutPreview | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    <div className="relative flex flex-col items-center gap-0.5">
      <button
        type="button"
        onClick={handlePreviewClick}
        disabled={isPending}
        className="text-[9px] text-fog hover:text-paper underline disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
      >
        {isPending && mode === "idle" ? "Cargando..." : "Enviar a Garmin"}
      </button>
      {error && <span className="text-[9px] text-fatiga text-center">{error}</span>}

      {mode === "previewing" && preview && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-10 w-56 data-surface rounded-sm p-3 space-y-2 text-left shadow-lg">
          <div>
            <p className="text-sm text-paper font-semibold">{preview.workout_name}</p>
            <p className="text-[10px] text-fog uppercase tracking-wide">
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
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              disabled={isPending}
              onClick={handleConfirm}
              className="text-xs text-volt hover:text-paper underline disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              {isPending ? "Enviando..." : "Confirmar envío"}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={handleCancel}
              className="text-xs text-fog hover:text-paper underline disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
