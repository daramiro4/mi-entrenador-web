"use client";

import { ExerciseAnimation } from "@/components/exercises/ExerciseAnimation";
import { useRig } from "@/components/exercises/use-rig";
import { catalogKeyForSlug } from "@/lib/exercises/legacy-keys";
import type { Exercise } from "@/lib/strength/types";
import { PoseLoop, PosePair } from "./PoseFigure";

/**
 * Dibujo de un ejercicio de la rutina. Si su ficha del catálogo tiene animación nueva (ANIMATION_MAP) se muestra esa; si no
 * —o mientras carga, o si falla— se muestran las poses estáticas antiguas, así que nunca queda un hueco.
 *  - "card": ficha dentro de la lista de la rutina (las dos posturas, o la animación con sus controles).
 *  - "live": entreno en vivo (bucle compacto, para no robar espacio al contador de series).
 */
export function ExerciseFigure({ exercise, variant }: { exercise: Exercise; variant: "card" | "live" }) {
  const key = catalogKeyForSlug(exercise.slug);
  const slash = key ? key.indexOf("/") : -1;
  const category = key && slash > 0 ? key.slice(0, slash) : "";
  const name = key && slash > 0 ? key.slice(slash + 1) : "";
  const { rig } = useRig(category, name);

  if (rig) return <ExerciseAnimation rig={rig} showSteps={false} compact={variant === "live"} className="w-full" />;
  return variant === "live" ? (
    <PoseLoop name={exercise.name_es} a={exercise.pose_a} b={exercise.pose_b} labels={exercise.pose_labels} />
  ) : (
    <PosePair name={exercise.name_es} a={exercise.pose_a} b={exercise.pose_b} labels={exercise.pose_labels} />
  );
}
