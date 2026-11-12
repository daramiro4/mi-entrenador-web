import { seasonPillLabel } from "@/lib/dashboard-v2";
import type { GoalType } from "@/lib/types";

/** Pill con la temporada activa: objetivo y fecha objetivo (en mono). */
export function SeasonPill({ goalType, targetDate }: { goalType: GoalType; targetDate: string | null }) {
  return (
    <span
      className="inline-flex min-h-11 items-center rounded-full border border-separator bg-surface px-4 font-mono text-xs uppercase tracking-wide text-label"
      aria-label={`Temporada activa: ${seasonPillLabel(goalType, targetDate)}`}
    >
      {seasonPillLabel(goalType, targetDate)}
    </span>
  );
}
