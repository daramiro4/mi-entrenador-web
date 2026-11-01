import { Watch, AlertTriangle, Repeat } from "lucide-react";
import { Chip } from "@/components/ui/Chip";
import { PosePair } from "./PoseFigure";
import { EXERCISE_BY_SLUG } from "@/lib/strength/library";
import { EQUIPMENT_LABEL, LEVEL_LABEL, PATTERN_LABEL } from "@/lib/strength/labels";
import type { Exercise } from "@/lib/strength/types";

/** Ficha del ejercicio: posturas, claves de técnica, error común, alternativas y envío al reloj. */
export function ExerciseCard({ exercise }: { exercise: Exercise }) {
  const alts = exercise.alternatives.map((s) => EXERCISE_BY_SLUG[s]?.name_es).filter(Boolean);
  return (
    <article className="glass-card is-hoverable flex flex-col gap-4">
      <header>
        <h3 className="text-lg font-semibold">{exercise.name_es}</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          <Chip tone="accent">{PATTERN_LABEL[exercise.pattern]}</Chip>
          <Chip>{LEVEL_LABEL[exercise.level]}</Chip>
          {exercise.equipment.map((e) => (
            <Chip key={e}>{EQUIPMENT_LABEL[e]}</Chip>
          ))}
        </div>
      </header>
      <PosePair name={exercise.name_es} a={exercise.pose_a} b={exercise.pose_b} labels={exercise.pose_labels} />
      <section aria-label="Claves de técnica">
        <h4 className="text-sm font-medium">Claves de técnica</h4>
        <ul className="mt-1 list-disc pl-5 text-sm text-label-2">
          {exercise.cues_es.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </section>
      <p className="flex gap-2 text-sm text-label-2">
        <AlertTriangle size={18} strokeWidth={1.75} aria-hidden="true" className="mt-0.5 shrink-0 text-warning" />
        <span>
          <span className="font-medium text-label">Error común: </span>
          {exercise.common_error_es}
        </span>
      </p>
      {alts.length > 0 && (
        <p className="flex gap-2 text-sm text-label-2">
          <Repeat size={18} strokeWidth={1.75} aria-hidden="true" className="mt-0.5 shrink-0" />
          <span>
            <span className="font-medium text-label">Alternativas: </span>
            {alts.join(" · ")}
          </span>
        </p>
      )}
      <p className="flex gap-2 text-xs text-label-2">
        <Watch size={16} strokeWidth={1.75} aria-hidden="true" className="mt-0.5 shrink-0" />
        <span>
          En el reloj: {exercise.garmin_category.replaceAll("_", " ").toLowerCase()} ·{" "}
          {exercise.garmin_exercise.replaceAll("_", " ").toLowerCase()}
        </span>
      </p>
    </article>
  );
}
