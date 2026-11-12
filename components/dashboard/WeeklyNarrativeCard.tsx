import { GlassCard } from "@/components/ui/GlassCard";
import { splitNarrative } from "@/lib/dashboard-v2";
import type { WeeklyNarrative } from "@/lib/types";

/** Lectura semanal (narrativa IA): etiqueta Volt, titular Barlow, párrafo de máx. 65 caracteres de ancho. */
export function WeeklyNarrativeCard({ narrative }: { narrative: Pick<WeeklyNarrative, "narrative"> | null }) {
  const split = narrative ? splitNarrative(narrative.narrative) : null;

  return (
    <GlassCard aria-labelledby="lectura-title">
      <p id="lectura-title" className="font-mono text-xs uppercase tracking-wider text-volt">Lectura semanal</p>
      {split ? (
        <>
          <p className="mt-3 font-display text-[32px] font-bold leading-[1.1]">{split.headline}</p>
          {split.body && <p className="mt-3 max-w-[65ch] text-base leading-relaxed text-label-2">{split.body}</p>}
          <p className="mt-4 text-xs text-label-2">
            Redactado con IA a partir de los datos de tu semana; puede equivocarse.
          </p>
        </>
      ) : (
        <p className="mt-3 max-w-[65ch] text-base text-label-2">
          Aún no hay lectura semanal: se generará al cerrar la semana, con el resumen de tu TSS y tus sesiones.
        </p>
      )}
    </GlassCard>
  );
}
