import { Flame } from "lucide-react";
import { Chip } from "@/components/ui/Chip";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { weekHeadline } from "@/lib/dashboard-stats";

/** Cabecera de "Esta semana": titular, racha, TSS hecho / planificado, barra Ember y avance del bloque. */
export function WeekHeader({
  completedTss,
  targetTss,
  targetIsEstimate = false,
  blockPct = null,
  streak,
  redistribution,
}: {
  completedTss: number;
  targetTss: number;
  /** El objetivo incluye sesiones estimadas (fuerza o reaclimatación, sin TSS planificado). */
  targetIsEstimate?: boolean;
  /** Fracción (0-1) del TSS del bloque cumplido desde el último test de FTP, o null si no aplica. */
  blockPct?: number | null;
  streak: number;
  redistribution: string | null;
}) {
  return (
    <div className="mb-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-2xl">Esta semana</h2>
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
          <span className="text-label-2">TSS hecho / planificado</span>
          <span className="font-mono font-medium">
            {completedTss} / {targetIsEstimate ? "≈" : ""}{targetTss}
          </span>
        </div>
        <ProgressBar value={completedTss} max={targetTss} label="TSS completado de la semana" />
      </div>
      {blockPct != null && (
        <p className="mt-2 text-sm text-label-2">
          Bloque: <span className="font-mono text-label">{Math.round(blockPct * 100)} %</span> del TSS cumplido
        </p>
      )}
      {targetIsEstimate && (
        <p className="mt-1.5 text-xs text-label-2">
          Objetivo estimado: incluye sesiones sin TSS planificado (fuerza, reaclimatación). El test de rampa no cuenta.
        </p>
      )}
      {redistribution && <p className="mt-2 text-xs text-label-2">{redistribution}</p>}
    </div>
  );
}
