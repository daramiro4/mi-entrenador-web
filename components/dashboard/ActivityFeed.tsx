"use client";

import { Button } from "@/components/ui/Button";
import { useState, useTransition } from "react";
import { loadMoreActivitiesAction } from "@/app/dashboard/activity-feed-actions";
import { getActivityTypeCircleClass, getActivityTypeLabel } from "@/lib/labels";
import type { ActivityRow, StrengthSessionRow } from "@/lib/types";
import { loadBasedTss } from "@/lib/strength/tss";

const MONTH_LABELS = [
  "ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic",
];

function formatDate(date: string): string {
  const month = Number(date.slice(5, 7)) - 1;
  return `${Number(date.slice(8, 10))} ${MONTH_LABELS[month]}`;
}

function formatExercise(row: StrengthSessionRow): string {
  const parts: string[] = [];
  if (row.sets != null && row.reps != null) parts.push(`${row.sets}×${row.reps}`);
  if (row.weight_kg != null) parts.push(`${row.weight_kg} kg`);
  return parts.length > 0 ? `${row.exercise} — ${parts.join(" @ ")}` : row.exercise;
}

function primaryStat(activity: ActivityRow, exerciseCount: number): string | null {
  if (activity.activity_type === "strength") {
    const parts: string[] = [];
    if (exerciseCount > 0) parts.push(`${exerciseCount} ejercicio${exerciseCount === 1 ? "" : "s"}`);
    const tss = loadBasedTss(activity);
    if (tss) parts.push(`${tss.estimated ? "≈" : ""}${Math.round(tss.tss)} TSS`);
    return parts.length > 0 ? parts.join(" · ") : null;
  }
  if (activity.avg_power != null && activity.tss != null) {
    return `${Math.round(activity.avg_power)} W · ${Math.round(activity.tss)} TSS`;
  }
  if (activity.avg_power != null) {
    return `${Math.round(activity.avg_power)} W`;
  }
  if (activity.tss != null) {
    return `${Math.round(activity.tss)} TSS`;
  }
  // Sin potencia ni TSS (p. ej. "otros"): se muestra la carga de Garmin como TSS estimado, que es lo que suma a la semana.
  const est = loadBasedTss(activity);
  return est ? `≈${Math.round(est.tss)} TSS` : null;
}

export function ActivityFeed({
  initialActivities,
  initialStrengthSessionsByActivityId,
  initialHasMore,
  pageSize,
}: {
  initialActivities: ActivityRow[];
  initialStrengthSessionsByActivityId: Record<number, StrengthSessionRow[]>;
  initialHasMore: boolean;
  pageSize: number;
}) {
  const [activities, setActivities] = useState(initialActivities);
  const [strengthByActivityId, setStrengthByActivityId] = useState(
    initialStrengthSessionsByActivityId
  );
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleLoadMore = () => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await loadMoreActivitiesAction(activities.length, pageSize);
        setActivities((current) => [...current, ...result.activities]);
        setStrengthByActivityId((current) => ({
          ...current,
          ...result.strengthSessionsByActivityId,
        }));
        setHasMore(result.hasMore);
      } catch {
        setError("No se pudieron cargar más actividades.");
      }
    });
  };

  return (
    <div className="data-surface">
      <h2 className="mb-3 text-xl">Actividades</h2>

      {activities.length === 0 ? (
        <p className="text-sm text-fog">Aún no hay actividades registradas.</p>
      ) : (
        <ul>
          {activities.map((activity) => {
            const exercises = strengthByActivityId[activity.id] ?? [];
            const isStrength = activity.activity_type === "strength";
            const isExpanded = expandedId === activity.id;
            const label = getActivityTypeLabel(activity.activity_type);

            return (
              <li key={activity.id} className="border-t border-fog/15 first:border-t-0">
                <button
                  type="button"
                  disabled={!isStrength || exercises.length === 0}
                  onClick={() => setExpandedId((current) => (current === activity.id ? null : activity.id))}
                  className={`w-full flex items-center gap-3 py-3 text-left ${
                    isStrength && exercises.length > 0 ? "cursor-pointer" : "cursor-default"
                  }`}
                >
                  <span
                    className={`h-9 w-9 shrink-0 rounded-full border flex items-center justify-center text-xs font-semibold ${getActivityTypeCircleClass(activity.activity_type)}`}
                  >
                    {label[0]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-paper font-medium">{label}</p>
                    <p className="text-xs text-fog">{formatDate(activity.date)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {primaryStat(activity, exercises.length) && (
                      <p className="metric text-base text-paper leading-none">
                        {primaryStat(activity, exercises.length)}
                      </p>
                    )}
                    {activity.duration_minutes != null && (
                      <p className="metric text-xs text-fog mt-1">
                        {Math.round(activity.duration_minutes)} min
                      </p>
                    )}
                  </div>
                </button>
                {isStrength && isExpanded && exercises.length > 0 && (
                  <ul className="pb-3 space-y-1">
                    {exercises.map((exercise) => (
                      <li key={exercise.id} className="text-xs text-paper pl-12">
                        {formatExercise(exercise)}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {hasMore && (
        <Button type="button" variant="secondary" className="mt-3" disabled={isPending} onClick={handleLoadMore}>
          {isPending ? "Cargando…" : "Cargar más"}
        </Button>
      )}
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}
