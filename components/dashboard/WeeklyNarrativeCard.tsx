import type { WeeklyNarrative } from "@/lib/types";

export function WeeklyNarrativeCard({ narrative }: { narrative: WeeklyNarrative | null }) {
  if (!narrative) return null;

  return (
    <div className="data-surface p-5">
      <p className="text-xs text-fog mb-2">Resumen de la semana</p>
      <p className="text-sm text-paper leading-relaxed">{narrative.narrative}</p>
    </div>
  );
}
