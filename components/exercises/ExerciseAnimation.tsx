"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Pause, Play, FlipHorizontal2 } from "lucide-react";
import { evalRig, muscleOpacityAt, phaseIndexAt, timeAt } from "@/lib/exercises/rig/interpolate";
import type { Rig } from "@/lib/exercises/rig/types";
import { RigStage } from "./RigStage";

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (cb: () => void) => {
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const reducedSnapshot = () => window.matchMedia(REDUCED_QUERY).matches;

/**
 * Ficha animada de un ejercicio: SVG puro, interpolación en cliente (requestAnimationFrame), bucle de 4-8 s, pausa, espejo
 * izquierda/derecha, subtítulo por fase, resalte del músculo y pasos numerados sincronizados con la fase.
 * Con `prefers-reduced-motion: reduce` no se anima: se muestra la pose inicial estática (y los pasos quedan fijos).
 */
export function ExerciseAnimation({
  rig,
  autoPlay = true,
  showSteps = true,
  compact = false,
  className,
  below,
}: {
  rig: Rig;
  autoPlay?: boolean;
  showSteps?: boolean;
  /** Versión baja para el entreno en vivo: escenario limitado en altura y rótulo de fase más pequeño. */
  compact?: boolean;
  className?: string;
  /** Contenido entre el escenario y los pasos numerados (metadatos, título, dosis…). */
  below?: React.ReactNode;
}) {
  const reduced = useSyncExternalStore(subscribeReduced, reducedSnapshot, () => false);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(autoPlay);
  const [mirror, setMirror] = useState(false);
  const elapsed = useRef(0);

  useEffect(() => {
    if (!playing || reduced) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      elapsed.current += now - last;
      last = now;
      setT(timeAt(elapsed.current, rig.loop_ms));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, reduced, rig.loop_ms]);

  const shown = reduced ? 0 : t;
  const joints = evalRig(rig, shown);
  const phaseIndex = phaseIndexAt(rig.phases, shown);
  const phase = rig.phases[phaseIndex];
  const opacity = muscleOpacityAt(rig.phases, shown);

  const steps = rig.phases.map((p, i) => ({ text: p.step_es, phaseIndex: i })).filter((s): s is { text: string; phaseIndex: number } => !!s.text);
  const activeStep = steps.reduce((acc, s, i) => (s.phaseIndex <= phaseIndex ? i : acc), 0);

  return (
    <section className={className} aria-label={`Animación: ${rig.title_es}`}>
      <div className="data-surface !p-3 sm:!p-4">
        <p className={compact ? "min-h-6 text-center font-display text-lg" : "min-h-7 text-center font-display text-2xl"} aria-hidden="true">
          {phase?.label_es}
        </p>
        <RigStage
          rig={rig}
          joints={joints}
          muscleOpacity={opacity}
          mirror={mirror}
          label={`${rig.title_es}. Fase: ${phase?.label_es ?? ""}`}
          className={compact ? "mx-auto h-auto max-h-[26vh] w-full max-w-xl" : "mx-auto h-auto w-full max-w-xl"}
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-label-2">
            {rig.highlight ? (
              <>
                Trabaja: <span className="text-volt">{rig.highlight.label_es}</span>
              </>
            ) : null}
          </p>
          <div className="flex items-center gap-1">
            {rig.unilateral && (
              <button
                type="button"
                onClick={() => setMirror((m) => !m)}
                aria-pressed={mirror}
                aria-label="Cambiar de lado (izquierda / derecha)"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-label-2 hover:bg-fill hover:text-label"
              >
                <FlipHorizontal2 size={20} aria-hidden="true" />
              </button>
            )}
            {!reduced && (
              <button
                type="button"
                onClick={() => setPlaying((p) => !p)}
                aria-label={playing ? "Pausar la animación" : "Reproducir la animación"}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-surface-2 text-label hover:brightness-110"
              >
                {playing ? <Pause size={20} aria-hidden="true" /> : <Play size={20} aria-hidden="true" />}
              </button>
            )}
          </div>
        </div>
      </div>
      {below}
      {showSteps && steps.length > 0 && (
        <ol className="mt-4 space-y-2" aria-label="Cómo hacerlo">
          {steps.map((s, i) => (
            <li
              key={i}
              aria-current={i === activeStep ? "step" : undefined}
              className={`flex gap-3 rounded-[12px] border px-3 py-2 text-base ${i === activeStep ? "border-label bg-surface-2 text-label" : "border-separator text-label-2"}`}
            >
              <span className="font-mono text-sm leading-6">{i + 1}</span>
              <span>{s.text}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
