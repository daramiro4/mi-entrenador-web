"use client";

import { useState, useTransition } from "react";
import { deleteWorkoutAction } from "@/app/workouts/actions";

export function DeleteWorkoutButton({ workoutId }: { workoutId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteWorkoutAction(workoutId);
      if (!result.ok) {
        setError(result.error);
      }
    });
  };

  if (confirming) {
    return (
      <div className="flex flex-wrap items-center gap-1 text-sm">
        <span className="text-label-2">¿Borrar?</span>
        <button
          type="button"
          disabled={isPending}
          onClick={handleDelete}
          className="inline-flex min-h-11 items-center rounded-full px-3 text-danger hover:bg-fill disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          Sí, borrar
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => setConfirming(false)}
          className="inline-flex min-h-11 items-center rounded-full px-3 text-label-2 hover:text-label disabled:opacity-40 cursor-pointer"
        >
          Cancelar
        </button>
        {error && <span className="text-danger">{error}</span>}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="inline-flex min-h-11 items-center px-2 text-sm text-label-2 hover:text-danger cursor-pointer"
    >
      Borrar
    </button>
  );
}
