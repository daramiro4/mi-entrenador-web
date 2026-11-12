"use client";

import { Dumbbell } from "lucide-react";
import { evalRig, muscleOpacityAt } from "@/lib/exercises/rig/interpolate";
import { hasAnimation } from "@/lib/exercises/animation-map";
import { peakTime } from "./ExerciseStaticPoses";
import { RigStage } from "./RigStage";
import { useRig } from "./use-rig";

/** Miniatura de la lista: la pose más exigente del rig si el ejercicio tiene animación; si no, un icono neutro. */
export function ExerciseThumb({ category, name, size = 56 }: { category: string; name: string; size?: number }) {
  const animated = hasAnimation(category, name);
  const { rig } = useRig(category, name);
  const box = { width: size, height: size };
  if (animated && rig) {
    const t = peakTime(rig);
    return (
      <div className="flex shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-surface-2" style={box} aria-hidden="true">
        <RigStage rig={rig} joints={evalRig(rig, t)} muscleOpacity={muscleOpacityAt(rig.phases, t)} label="" className="h-full w-full" />
      </div>
    );
  }
  return (
    <div className="flex shrink-0 items-center justify-center rounded-[12px] bg-surface-2 text-label-2" style={box} aria-hidden="true">
      <Dumbbell size={size * 0.4} strokeWidth={1.5} />
    </div>
  );
}
