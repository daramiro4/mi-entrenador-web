import { ChevronDown } from "lucide-react";
import { FatigueRing } from "@/components/fatigue-ring/FatigueRing";
import { GlassCard } from "@/components/ui/GlassCard";
import { FATIGUE_ZONES, fatigueView } from "@/lib/dashboard-v2";
import type { FatigueIndexRow, FatigueRecommendation } from "@/lib/types";

const fmt = (v: number | null, digits = 2) => (v == null ? "—" : v.toFixed(digits));

/** Hero a): anillo de fatiga, leyenda de 3 zonas y detalle desplegable (ratio y cargas). */
export function StatusCard({ fatigueIndex }: { fatigueIndex: FatigueIndexRow | null }) {
  const recommendation = (fatigueIndex?.recommendation as FatigueRecommendation | null) ?? null;
  const view = fatigueView(recommendation);

  return (
    <GlassCard aria-labelledby="estado-title" className="flex flex-col">
      <h2 id="estado-title" className="text-xl">Tu estado</h2>
      <div className="mt-4">
        <FatigueRing recommendation={recommendation} />
      </div>
      <ul className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-1" aria-label="Zonas de fatiga">
        {FATIGUE_ZONES.map((zone, i) => (
          <li
            key={zone.key}
            aria-current={view?.zoneIndex === i ? "true" : undefined}
            className={`text-sm ${view?.zoneIndex === i ? "font-semibold text-label" : "text-label-2"}`}
          >
            {zone.label}
          </li>
        ))}
      </ul>
      {fatigueIndex && (
        <details className="group mt-3 border-t border-separator pt-1">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-center gap-2 text-sm text-label-2 hover:text-label [&::-webkit-details-marker]:hidden">
            Ver detalle
            <ChevronDown size={16} aria-hidden="true" className="transition-transform group-open:rotate-180" />
          </summary>
          <dl className="grid grid-cols-3 gap-3 pb-2 pt-2 text-center">
            <div>
              <dt className="text-xs text-label-2">ACWR</dt>
              <dd className="font-mono text-lg">{fmt(fatigueIndex.acwr_ratio)}</dd>
            </div>
            <div>
              <dt className="text-xs text-label-2">Carga aguda</dt>
              <dd className="font-mono text-lg">{fmt(fatigueIndex.acute_load, 0)}</dd>
            </div>
            <div>
              <dt className="text-xs text-label-2">Carga crónica</dt>
              <dd className="font-mono text-lg">{fmt(fatigueIndex.chronic_load, 0)}</dd>
            </div>
          </dl>
          {fatigueIndex.notes && <p className="pb-2 text-center text-xs text-label-2">{fatigueIndex.notes}</p>}
        </details>
      )}
    </GlassCard>
  );
}
