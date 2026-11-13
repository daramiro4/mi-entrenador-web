import { Footprints } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Chip } from "@/components/ui/Chip";
import { ExerciseCard } from "./ExerciseCard";
import { EXERCISE_BY_SLUG } from "@/lib/strength/library";
import { PATTERN_LABEL } from "@/lib/strength/labels";
import { describeLine } from "@/lib/strength/describe";
import type { WorkoutBlock } from "@/lib/strength/workout-types";

/** Lista de ejercicios del workout con patrón y carga; cada uno despliega su ficha con viñetas. */
export function ExerciseList({ blocks }: { blocks: WorkoutBlock[] }) {
  return (
    <GlassCard aria-labelledby="ej-title">
      <h2 id="ej-title" className="text-lg font-semibold">Ejercicios</h2>
      <div className="mt-4 grid gap-3">
        {blocks.map((b) =>
          b.kind === "cardio" ? (
            <div key={b.kind}>
              <p className="mb-2 text-xs text-label-2">{b.title}</p>
              <div className="tile flex min-h-14 items-center justify-between gap-2 px-4 py-3">
                <span>
                  <span className="block font-medium">Cinta · {b.cap_min ?? 10} min</span>
                  <span className="block text-sm text-label-2">Ritmo cómodo, puedes hablar sin ahogarte (zona 2)</span>
                </span>
                <Footprints size={20} strokeWidth={1.75} aria-hidden="true" className="shrink-0 text-label-2" />
              </div>
            </div>
          ) : (
          <div key={b.kind}>
            <p className="mb-2 text-xs text-label-2">
              {b.title}
              {b.rounds && b.rounds > 1 ? ` · ${b.rounds} rondas` : ""}
              {b.cap_min ? ` · ${b.cap_min} min` : ""}
            </p>
            <ul className="grid gap-2">
              {b.exercises.map((e) => {
                const ex = EXERCISE_BY_SLUG[e.slug];
                return (
                  <li key={`${b.kind}-${e.slug}`} className="tile !p-0">
                    <details className="group">
                      <summary className="flex min-h-14 cursor-pointer list-none flex-wrap items-center justify-between gap-2 px-4 py-3">
                        <span>
                          <span className="block font-medium">{e.name}</span>
                          <span className="block text-sm text-label-2">{describeLine(e, b)}</span>
                        </span>
                        <Chip>{PATTERN_LABEL[e.pattern]}</Chip>
                      </summary>
                      {ex && (
                        <div className="px-4 pb-4">
                          <ExerciseCard exercise={ex} bare />
                          {e.note && <p className="mt-3 text-sm text-accent">{e.note}</p>}
                        </div>
                      )}
                    </details>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
