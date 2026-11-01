import { Award, Dumbbell, Timer, Trophy } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Tile } from "@/components/ui/Tile";
import { Chip } from "@/components/ui/Chip";
import type { Badge, Totals } from "@/lib/dashboard-stats";

export function TotalsCard({ totals, badges }: { totals: Totals; badges: Badge[] }) {
  return (
    <GlassCard aria-labelledby="totales-title">
      <h2 id="totales-title" className="text-lg font-semibold">Totales y logros</h2>
      <dl className="mt-4 grid grid-cols-3 gap-3">
        <Tile>
          <Dumbbell size={18} strokeWidth={1.75} aria-hidden="true" className="text-label-2" />
          <dd className="metric mt-1 text-xl font-semibold">{totals.strengthKgMonth.toLocaleString("es-ES")} kg</dd>
          <dt className="text-xs text-label-2">Fuerza este mes</dt>
        </Tile>
        <Tile>
          <Timer size={18} strokeWidth={1.75} aria-hidden="true" className="text-label-2" />
          <dd className="metric mt-1 text-xl font-semibold">{totals.hoursLast30} h</dd>
          <dt className="text-xs text-label-2">Últimos 30 días</dt>
        </Tile>
        <Tile>
          <Trophy size={18} strokeWidth={1.75} aria-hidden="true" className="text-label-2" />
          <dd className="metric mt-1 text-xl font-semibold">{totals.activitiesLast30}</dd>
          <dt className="text-xs text-label-2">Actividades</dt>
        </Tile>
      </dl>
      <ul className="mt-4 flex flex-wrap gap-2" aria-label="Insignias">
        {badges.map((b) => (
          <li key={b.key}>
            <Chip tone={b.earned ? "success" : "neutral"}>
              <Award size={14} strokeWidth={1.75} aria-hidden="true" className="mr-1" />
              {b.label}
              {b.earned ? " · conseguida" : " · pendiente"}
            </Chip>
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}
