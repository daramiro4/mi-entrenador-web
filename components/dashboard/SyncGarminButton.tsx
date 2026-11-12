"use client";

import { useState, useTransition } from "react";
import { syncFromGarminAction } from "@/app/dashboard/garmin-sync-actions";
import { Button } from "@/components/ui/Button";
import { fatigueView } from "@/lib/dashboard-v2";
import type { FatigueRecommendation } from "@/lib/types";

type Mode = "idle" | "done" | "error";

export function SyncGarminButton() {
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
