import Link from "next/link";
import type { Workout } from "@/lib/types";
import { WORKOUT_TYPE_LABEL } from "@/lib/labels";
import { computeWorkoutDurationMinutes } from "@/lib/workout-intervals";
import { DeleteWorkoutButton } from "./DeleteWorkoutButton";

export function WorkoutsList({ workouts }: { workouts: Workout[] }) {
  if (workouts.length === 0) {
    return <p className="text-sm text-fog">Aún no tienes plantillas.</p>;
  }

  return (
    <div className="space-y-3">
      {workouts.map((workout) => (
        <div
          key={workout.id}
          className="data-surface rounded-sm p-4 flex items-center justify-between gap-4"
        >
          <div>
            <p className="text-paper font-semibold">{workout.name}</p>
            <p className="text-xs text-fog uppercase tracking-wide">
              {workout.type ? WORKOUT_TYPE_LABEL[workout.type] : "—"} ·{" "}
              {computeWorkoutDurationMinutes(workout.intervals)} min ·{" "}
              {workout.intervals.length} pasos
            </p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <Link
              href={`/workouts/${workout.id}/edit`}
              className="text-xs text-fog hover:text-paper underline"
            >
              Editar
            </Link>
            <DeleteWorkoutButton workoutId={workout.id} />
          </div>
        </div>
      ))}
    </div>
  );
}
