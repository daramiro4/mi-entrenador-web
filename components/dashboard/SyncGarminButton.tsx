"use client";

import { useState, useTransition } from "react";
import { syncFromGarminAction } from "@/app/dashboard/garmin-sync-actions";
import { Button } from "@/components/ui/Button";
import { RECOMMENDATION_PHRASE } from "@/components/fatigue-ring/FatigueRing";
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
      const fatigueLabel = recommendation ? RECOMMENDATION_PHRASE[recommendation] : null;

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
        className="!px-3 !py-1.5 !text-xs"
      >
        {isPending ? "Sincronizando..." : "Actualizar desde Garmin"}
      </Button>
      {mode === "done" && summary && (
        <span className="text-[10px] text-fog">Sincronizado ✓ {summary}</span>
      )}
      {mode === "error" && error && <span className="text-[10px] text-fatiga">{error}</span>}
    </div>
  );
}
