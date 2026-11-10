import { Flame } from "lucide-react";
import { Chip } from "@/components/ui/Chip";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { weekHeadline } from "@/lib/dashboard-stats";

/** Cabecera de la tarjeta "Esta semana": titular, racha, barra de TSS y redistribución. */
export function WeekHeader({
  completedTss,
  targetTss,
  targetIsEstimate = false,
  streak,
  redistribution,
}: {
  completedTss: number;
  targetTss: number;
  /** El objetivo se estimó por duración (semana de reaclimatación, sin TSS planificado). */
  targetIsEstimate?: boolean;
  streak: number;
  redistribution: string | null;
}) {
  return (
    <div className="mb-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">Esta semana</h2>
          <p className="text-sm text-label-2">{weekHeadline(completedTss, targetTss)}</p>
        </div>
        {streak > 0 && (
          <Chip tone="success">
            <Flame size={14} strokeWidth={1.75} aria-hidden="true" className="mr-1" />
            Racha: {streak} {streak === 1 ? "semana" : "semanas"}
          </Chip>
        )}
      </div>
      <div className="mt-3">
        <div className="mb-1.5 flex items-baseline justify-between text-sm">
          <span className="text-label-2">TSS completado</span>
          <span className="metric font-medium">
            {completedTss} / {targetIsEstimate ? "≈" : ""}{targetTss}
          </span>
        </div>
        <ProgressBar value={completedTss} max={targetTss} label="TSS completado de la semana" />
      </div>
      {targetIsEstimate && (
        <p className="mt-1.5 text-xs text-label-2">
          Objetivo estimado: semana de reaclimatación, en Z2 suave (sin contar el test de rampa).
        </p>
      )}
      {redistribution && <p className="mt-2 text-xs text-label-2">{redistribution}</p>}
    </div>
  );
}
