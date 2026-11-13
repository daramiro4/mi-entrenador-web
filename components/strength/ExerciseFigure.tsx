"use client";

import { useEffect, useRef, useState } from "react";
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
  // El rig solo se descarga cuando la figura llega a verse (dentro de un <details> cerrado no cuenta): una rutina tiene ~10 ejercicios.
  const ref = useRef<HTMLDivElement | null>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setSeen(true);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);
  const { rig } = useRig(seen ? category : "", seen ? name : "");

  return (
    <div ref={ref} className="w-full">
      {rig ? (
        <ExerciseAnimation rig={rig} showSteps={false} compact={variant === "live"} className="w-full" />
      ) : variant === "live" ? (
        <PoseLoop name={exercise.name_es} a={exercise.pose_a} b={exercise.pose_b} labels={exercise.pose_labels} />
      ) : (
        <PosePair name={exercise.name_es} a={exercise.pose_a} b={exercise.pose_b} labels={exercise.pose_labels} />
      )}
    </div>
  );
}
