"use client";

import { useEffect, useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { generateSessionReviewAction } from "@/app/dashboard/session-review-actions";
import { validReview } from "@/lib/session-review";
import type { PlannedSession } from "@/lib/types";

// Evita lanzar dos veces la misma reseña (React en desarrollo monta los efectos dos veces).
const inFlight = new Set<string>();

/** Reseña de IA del entreno: si no existe aún se pide sola al abrirlo (se guarda, así que las siguientes veces es instantánea). */
export function SessionReview({ session }: { session: PlannedSession }) {
  // La guardada (derivada de la sesión) manda; `generated` solo cubre el instante entre generar y que la página se refresque.
  const [generated, setGenerated] = useState<string | null>(null);
  const text = validReview(session)?.text ?? generated;
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (text != null || inFlight.has(session.id)) return;
    inFlight.add(session.id);
    startTransition(async () => {
      const result = await generateSessionReviewAction(session.id);
      inFlight.delete(session.id);
      if (result.ok && result.review) {
        setGenerated(result.review.text);
        setError(null);
      } else {
        setError(result.error ?? "No se pudo generar la reseña.");
      }
    });
    // `attempt` fuerza el reintento manual; `text`/`session.id` son lo que decide si hace falta.
  }, [session.id, text, attempt]);

  return (
    <div className="rounded-[12px] bg-surface-2 px-3 py-2.5">
      <p className="mb-1 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-label-2">
        <Sparkles size={12} aria-hidden="true" /> Reseña del entreno
      </p>
      {text ? (
        <p className="text-sm text-label">{text}</p>
      ) : error ? (
        <p className="text-sm text-label-2">
          {error}{" "}
          <button type="button" className="font-medium text-accent cursor-pointer" onClick={() => { setError(null); setAttempt((n) => n + 1); }}>
            Reintentar
          </button>
        </p>
      ) : (
        <p className="text-sm text-label-2" role="status">{isPending ? "Analizando tu entreno…" : "Preparando la reseña…"}</p>
      )}
    </div>
  );
}
