import { evalRig, muscleOpacityAt } from "@/lib/exercises/rig/interpolate";
import type { Dose } from "@/lib/exercises/catalog";
import type { Rig } from "@/lib/exercises/rig/types";
import { RigStage } from "./RigStage";

/** Instante de la pose "final": el centro de la fase con más trabajo muscular (el punto más exigente del movimiento). */
export function peakTime(rig: Rig): number {
  let best = rig.phases[0];
  for (const p of rig.phases) if ((p.muscle_opacity ?? 0.35) > (best.muscle_opacity ?? 0.35)) best = p;
  return (best.from + best.to) / 2;
}

const doseLabel = (d: Dose) => (d.type === "time" ? `${d.seconds} s` : `${d.reps} repeticiones`);

/**
 * Ficha de respaldo para un ejercicio SIN animación: pose inicial y pose final estáticas generadas del mismo rig, más el músculo
 * y la dosis. No añade texto de técnica (no se inventa): solo lo que el rig y los datos del ejercicio ya dicen.
 */
export function ExerciseStaticPoses({ rig, dose, className }: { rig: Rig; dose?: Dose | null; className?: string }) {
  const t = peakTime(rig);
  const frames = [
    { name: "Inicio", t: 0 },
    { name: "Final", t },
  ];
  return (
    <section className={className} aria-label={`Poses: ${rig.title_es}`}>
      <div className="grid grid-cols-2 gap-3">
        {frames.map((f) => (
          <figure key={f.name} className="data-surface !p-3">
            <RigStage rig={rig} joints={evalRig(rig, f.t)} muscleOpacity={f.t === 0 ? 0.2 : muscleOpacityAt(rig.phases, f.t)} label={`${rig.title_es}: pose ${f.name.toLowerCase()}`} />
            <figcaption className="mt-1 text-center text-sm text-label-2">{f.name}</figcaption>
          </figure>
        ))}
      </div>
      <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-label-2">
        {rig.highlight && (
          <span>
            Trabaja: <span className="text-volt">{rig.highlight.label_es}</span>
          </span>
        )}
        {dose && <span>Dosis: <span className="font-mono text-label">{doseLabel(dose)}</span></span>}
      </p>
    </section>
  );
}
