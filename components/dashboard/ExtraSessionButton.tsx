"use client";

import { useState, useTransition } from "react";
import {
  sendExtraSessionAction,
  suggestExtraSessionAction,
} from "@/app/dashboard/extra-session-actions";
import { Button } from "@/components/ui/Button";
import type { ExtraSessionVariant } from "@/lib/extra-session";
import type { GarminWorkoutPreview } from "@/lib/garmin";

type State =
  | { mode: "idle" }
  | { mode: "no_session"; reason: string }
  | { mode: "previewing"; variant: ExtraSessionVariant; reason: string; preview: GarminWorkoutPreview }
  | { mode: "sent" };

/**
 * "¿Hago bici extra?" — sesión voluntaria por pulso en el gimnasio
 * (lib/extra-session.ts). Mismo flujo que SendToGarminButton: vista previa
 * primero, envío solo tras confirmar.
 */
export function ExtraSessionButton() {
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<State>({ mode: "idle" });
  const [error, setError] = useState<string | null>(null);

  const handleSuggest = () => {
    setError(null);
    startTransition(async () => {
      const result = await suggestExtraSessionAction();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.suggestion.type === "none" || !result.preview) {
        setState({ mode: "no_session", reason: result.suggestion.reason });
        return;
      }
      setState({
        mode: "previewing",
        variant: result.suggestion.variant,
        reason: result.suggestion.reason,
        preview: result.preview,
      });
    });
  };

  const handleConfirm = (variant: ExtraSessionVariant) => {
    setError(null);
    startTransition(async () => {
      const result = await sendExtraSessionAction(variant);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setState({ mode: "sent" });
    });
  };

  const handleCancel = () => {
    setError(null);
    setState({ mode: "idle" });
  };

  if (state.mode === "sent") {
    return <span className="inline-flex min-h-11 items-center text-sm text-accent" role="status">Bici extra enviada al reloj</span>;
  }

  return (
    <div className="flex flex-col items-center sm:items-start gap-1">
      {state.mode !== "previewing" && (
        <Button
          type="button"
          variant="volt"
          onClick={handleSuggest}
          disabled={isPending}
        >
          {isPending ? "Pensando..." : "¿Hago bici extra?"}
        </Button>
      )}
      {state.mode === "no_session" && <span className="text-xs text-label-2">{state.reason}</span>}
      {error && <span className="text-xs text-danger">{error}</span>}

      {state.mode === "previewing" && (
        <div className="data-surface space-y-2 p-4 text-left w-full max-w-xs">
          <div>
            <p className="text-sm text-paper font-semibold">{state.preview.workout_name}</p>
            <p className="text-xs text-label-2">
              {state.preview.estimated_duration_minutes} min en total · por pulso
            </p>
            <p className="text-xs text-fog mt-1">{state.reason}</p>
          </div>
          <ul className="space-y-1">
            {state.preview.steps.map((step, index) => (
              <li key={index} className="text-xs text-paper">
                {step.label} · {step.duration_minutes} min
                {step.target_hr_zone != null && ` · Z${step.target_hr_zone}`}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => handleConfirm(state.variant)}>
              {isPending ? "Enviando..." : "Enviar al reloj"}
            </Button>
            <Button type="button" variant="ghost" disabled={isPending} onClick={handleCancel}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
