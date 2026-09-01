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
      <div className="flex items-center gap-2 text-xs">
        <span className="text-fog">¿Borrar?</span>
        <button
          type="button"
          disabled={isPending}
          onClick={handleDelete}
          className="text-fatiga hover:text-paper underline disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          Sí, borrar
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => setConfirming(false)}
          className="text-fog hover:text-paper underline disabled:opacity-40 cursor-pointer"
        >
          Cancelar
        </button>
        {error && <span className="text-fatiga">{error}</span>}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="text-xs text-fog hover:text-fatiga underline cursor-pointer"
    >
      Borrar
    </button>
  );
}
