"use client";

import { useState, useTransition } from "react";
import { sendPlannedSessionToGarminAction } from "@/app/dashboard/garmin-actions";

export function SendToGarminButton({ plannedSessionId }: { plannedSessionId: string }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; error: string | null } | null>(null);

  const handleClick = () => {
    setResult(null);
    startTransition(async () => {
      const outcome = await sendPlannedSessionToGarminAction(plannedSessionId);
      setResult(outcome);
    });
  };

  if (result?.ok) {
    return <span className="text-[9px] text-volt">Enviado ✓</span>;
  }

  return (
    <div className="flex flex-col items-center gap-0.5">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="text-[9px] text-fog hover:text-paper underline disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
      >
        {isPending ? "Enviando..." : "Enviar a Garmin"}
      </button>
      {result?.error && <span className="text-[9px] text-fatiga text-center">{result.error}</span>}
    </div>
  );
}
