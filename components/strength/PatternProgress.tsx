import { TrendingUp } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { PATTERN_LABEL } from "@/lib/strength/labels";
import type { Pattern } from "@/lib/strength/types";
import type { StrengthWorkoutRecord } from "@/lib/strength/data";

/** Series por patrón de movimiento en las rutinas terminadas de las últimas 4 semanas. */
export function patternVolume(rows: StrengthWorkoutRecord[], sinceISO: string): Partial<Record<Pattern, number>> {
  const out: Partial<Record<Pattern, number>> = {};
  for (const w of rows) {
    if (w.status !== "done" || w.date < sinceISO) continue;
    for (const b of w.blocks) {
      if (b.kind !== "main") continue;
      for (const e of b.exercises) {
        const sets = e.result?.sets.length ?? 0;
        if (sets > 0 && e.pattern !== "mobility") out[e.pattern] = (out[e.pattern] ?? 0) + sets;
      }
    }
  }
  return out;
}

export function PatternProgress({ volume }: { volume: Partial<Record<Pattern, number>> }) {
  const entries = (Object.entries(volume) as [Pattern, number][]).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map(([, v]) => v));
  return (
    <GlassCard aria-labelledby="pp-title">
      <h2 id="pp-title" className="text-lg font-semibold">Progreso por patrón</h2>
      <p className="text-sm text-label-2">Series completadas en las últimas 4 semanas.</p>
      {entries.length === 0 ? (
        <EmptyState icon={TrendingUp} text="Cuando termines tu primera rutina verás aquí tu volumen por patrón." />
      ) : (
        <ul className="mt-4 grid gap-3">
          {entries.map(([p, v]) => (
            <li key={p}>
              <div className="mb-1 flex justify-between text-sm">
                <span>{PATTERN_LABEL[p]}</span>
                <span className="metric text-label-2">{v} series</span>
              </div>
              <ProgressBar value={v} max={max} label={`Series de ${PATTERN_LABEL[p]}`} />
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}
