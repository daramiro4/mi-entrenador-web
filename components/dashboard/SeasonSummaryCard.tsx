import { GOAL_TYPE_LABEL, FOCUS_AREA_LABEL } from "@/lib/labels";
import type { ProgressSignal } from "@/lib/progress";
import type { Season } from "@/lib/types";

function daysUntil(dateStr: string): number {
  const target = new Date(`${dateStr}T00:00:00`);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function SeasonSummaryCard({
  season,
  currentFtpWatts,
  progress,
}: {
  season: Season;
  currentFtpWatts: number | null;
  progress: ProgressSignal | null;
}) {
  const daysLeft = season.target_date ? daysUntil(season.target_date) : null;

  return (
    <div className="data-surface rounded-sm p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-display text-2xl uppercase tracking-wide text-paper leading-none">
            {season.name}
          </p>
          <p className="text-fog text-sm mt-1">{GOAL_TYPE_LABEL[season.goal_type]}</p>
        </div>
        {daysLeft !== null && (
          <div className="text-right shrink-0">
            <p className="metric text-2xl text-volt leading-none">{daysLeft}</p>
            <p className="text-xs text-fog uppercase tracking-wide mt-1">días restantes</p>
          </div>
        )}
      </div>

      {season.focus_areas && season.focus_areas.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {season.focus_areas.map((area) => (
            <span
              key={area}
              className="text-xs px-2.5 py-1 rounded-full border border-fog/30 text-fog"
            >
              {FOCUS_AREA_LABEL[area]}
            </span>
          ))}
        </div>
      )}

      {season.target_ftp != null && (
        <div className="flex items-center gap-6 pt-3 border-t border-fog/15">
          <div>
            <p className="text-xs text-fog uppercase tracking-wide">FTP actual</p>
            <p className="metric text-xl text-paper">
              {currentFtpWatts != null ? `${Math.round(currentFtpWatts)} W` : "—"}
            </p>
          </div>
          <span className="text-fog">→</span>
          <div>
            <p className="text-xs text-fog uppercase tracking-wide">FTP objetivo</p>
            <p className="metric text-xl text-ember">{Math.round(season.target_ftp)} W</p>
          </div>
        </div>
      )}

      {progress?.pct != null && (
        <div className="pt-3 border-t border-fog/15">
          <div className="flex items-baseline justify-between">
            <p className="text-xs text-fog uppercase tracking-wide">Progreso del bloque</p>
            <p className="metric text-sm text-paper">
              {Math.round(progress.completedTss)} / {Math.round(progress.targetTss)} TSS
            </p>
          </div>
          <div className="h-1.5 rounded-full bg-fog/15 mt-2 overflow-hidden">
            <div
              className="h-full bg-volt rounded-full"
              style={{ width: `${Math.min(100, Math.round(progress.pct * 100))}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
