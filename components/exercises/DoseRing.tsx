"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import type { Dose } from "@/lib/exercises/catalog";
import { formatClock, remainingSeconds, ringFraction } from "@/lib/exercises/dose";
import { Button } from "@/components/ui/Button";

const SIZE = 132;
const STROKE = 10;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

/**
 * Dosis del ejercicio con un anillo. Por tiempo: cuenta atrás (Iniciar / Pausa / Reiniciar) y avisa al terminar.
 * Por repeticiones: el anillo completo con el número de repeticiones.
 */
export function DoseRing({ dose }: { dose: Dose }) {
  const total = dose.type === "time" ? dose.seconds : 0;
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const base = useRef(0);

  useEffect(() => {
    if (!running || total <= 0) return;
    const start = performance.now() - base.current;
    const id = window.setInterval(() => {
      const e = performance.now() - start;
      if (e >= total * 1000) {
        window.clearInterval(id);
        base.current = 0;
        setElapsed(total * 1000);
        setRunning(false);
        return;
      }
      base.current = e;
      setElapsed(e);
    }, 100);
    return () => window.clearInterval(id);
  }, [running, total]);

  const finished = dose.type === "time" && elapsed >= total * 1000;
  const fraction = dose.type === "time" ? ringFraction(total, elapsed) : 1;
  const left = dose.type === "time" ? remainingSeconds(total, elapsed) : 0;

  const reset = () => {
    base.current = 0;
    setElapsed(0);
    setRunning(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }} role="img" aria-label={dose.type === "time" ? `Dosis: ${total} segundos` : `Dosis: ${dose.reps} repeticiones`}>
        <svg width={SIZE} height={SIZE} aria-hidden="true">
          <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="var(--fill)" strokeWidth={STROKE} />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke={finished ? "var(--accent)" : "var(--volt)"}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - fraction)}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {dose.type === "time" ? (
            <>
              <span className="font-mono text-3xl leading-none">{formatClock(running || elapsed > 0 ? left : total)}</span>
              <span className="mt-1 text-xs text-label-2">{finished ? "Hecho" : "tiempo"}</span>
            </>
          ) : (
            <>
              <span className="font-mono text-4xl leading-none">{dose.reps}</span>
              <span className="mt-1 text-xs text-label-2">repeticiones</span>
            </>
          )}
        </div>
      </div>
      {dose.type === "time" && (
        <div className="flex items-center gap-2">
          <Button type="button" onClick={() => (finished ? reset() : setRunning((r) => !r))} aria-label={running ? "Pausar la cuenta atrás" : finished ? "Reiniciar la cuenta atrás" : "Iniciar la cuenta atrás"}>
            {running ? <Pause size={18} aria-hidden="true" className="mr-2" /> : <Play size={18} aria-hidden="true" className="mr-2" />}
            {running ? "Pausa" : finished ? "Repetir" : "Iniciar"}
          </Button>
          {(elapsed > 0 || running) && !finished && (
            <Button type="button" variant="ghost" onClick={reset} aria-label="Reiniciar la cuenta atrás">
              <RotateCcw size={18} aria-hidden="true" />
            </Button>
          )}
        </div>
      )}
      <p className="sr-only" role="status" aria-live="polite">{finished ? "Cuenta atrás terminada" : ""}</p>
    </div>
  );
}
