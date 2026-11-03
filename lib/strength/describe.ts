import type { BlockExercise, WorkoutBlock } from "./workout-types";

export function describeLine(e: BlockExercise, block?: Pick<WorkoutBlock, "rounds" | "cap_min">): string {
  const parts: string[] = [];
  if (e.rep_scheme) parts.push(e.rep_scheme.join("-") + " reps");
  else if (e.mode === "time") parts.push(`${e.sets > 1 ? `${e.sets} × ` : ""}${e.seconds ?? 40} s`);
  else parts.push(`${e.sets > 1 ? `${e.sets} × ` : ""}${e.reps ?? 10} reps`);
  if (e.weight_kg != null) parts.push(`${e.weight_kg} kg`);
  else if (e.mode === "reps") parts.push("carga a elegir");
  if (block?.rounds && !e.rep_scheme) parts.push(`× ${block.rounds} rondas`);
  return parts.join(" · ");
}

export function mainExercises(blocks: WorkoutBlock[]): BlockExercise[] {
  return blocks.filter((b) => b.kind === "main").flatMap((b) => b.exercises);
}

export const EFFORT_NEXT_TIME: Record<"easy" | "ok" | "hard", string> = {
  easy: "La próxima vez subiremos la carga o las repeticiones si completaste todo.",
  ok: "La próxima vez mantendremos la carga y te propondremos una repetición más si te sobra.",
  hard: "La próxima vez mantendremos o bajaremos la carga para que la técnica no se resienta.",
};
