"use client";

import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { syncFromGarminAction } from "@/app/dashboard/garmin-sync-actions";
import { Button } from "@/components/ui/Button";
import { fatigueView } from "@/lib/dashboard-v2";
import type { FatigueRecommendation } from "@/lib/types";

type Mode = "idle" | "done" | "error";

/** `compact`: versión pequeña para la cabecera (junto a la fecha): icono que gira mientras sincroniza y el resultado en línea. */
export function SyncGarminButton({ compact = false }: { compact?: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<Mode>("idle");
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    setError(null);
    startTransition(async () => {
      const result = await syncFromGarminAction();
      if (!result.ok) {
        setMode("error");
        setError(result.error);
        return;
      }

      const activityLabel =
        result.activitiesSynced === 1
          ? "1 actividad"
          : `${result.activitiesSynced ?? 0} actividades`;
      const recommendation = result.fatigue?.recommendation as FatigueRecommendation | undefined;
      const fatigueLabel = fatigueView(recommendation ?? null)?.word ?? null;

      setSummary(fatigueLabel ? `${activityLabel} · ${fatigueLabel}` : activityLabel);
      setMode("done");
    });
  };

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Button
          type="button"
          variant="volt"
          onClick={handleClick}
          disabled={isPending}
          aria-label="Actualizar desde Garmin"
          className="!min-h-11 !px-4 gap-2 !font-medium normal-case"
        >
          <RefreshCw size={16} strokeWidth={1.75} aria-hidden="true" className={isPending ? "animate-spin" : ""} />
          {isPending ? "Actualizando…" : "Actualizar"}
        </Button>
        {mode === "done" && summary && (
          <span className="text-xs text-label-2" role="status">Sincronizado · {summary}</span>
        )}
        {mode === "error" && error && <span className="text-xs text-danger" role="alert">{error}</span>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center sm:items-start gap-1">
      <Button
        type="button"
        variant="volt"
        onClick={handleClick}
        disabled={isPending}
      >
        {isPending ? "Sincronizando..." : "Actualizar desde Garmin"}
      </Button>
      {mode === "done" && summary && (
        <span className="text-xs text-label-2">Sincronizado · {summary}</span>
      )}
      {mode === "error" && error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}
