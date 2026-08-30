import { FatigueRing } from "@/components/fatigue-ring/FatigueRing";
import type { FatigueIndexRow, FatigueRecommendation } from "@/lib/types";

export function HeroStatus({ fatigueIndex }: { fatigueIndex: FatigueIndexRow | null }) {
  return (
    <div className="data-surface rounded-sm p-6 flex flex-col sm:flex-row items-center gap-6">
      <FatigueRing
        acwrRatio={fatigueIndex?.acwr_ratio ?? null}
        recommendation={(fatigueIndex?.recommendation as FatigueRecommendation | null) ?? null}
      />
      <div className="text-center sm:text-left">
        <p className="text-fog text-sm uppercase tracking-wide">Hoy</p>
        <p className="font-display text-3xl uppercase tracking-wide text-paper leading-tight mt-1">
          Sin sesión programada
        </p>
        <p className="text-fog text-sm mt-1">
          El plan de entrenamiento llega en la próxima fase.
        </p>
      </div>
    </div>
  );
}
