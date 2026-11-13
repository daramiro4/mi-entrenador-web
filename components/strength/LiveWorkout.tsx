"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeftRight, Check, Footprints, Minus, Plus, X } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SingleChoice } from "@/components/ui/Choice";
import { ExerciseFigure } from "./ExerciseFigure";
import { EffortCard } from "./EffortCard";
import { finishWorkoutAction, logSetAction, saveProgressAction } from "@/app/fuerza/entreno/actions";
import { ANTIDOTE_NAME } from "@/lib/strength/antidote";
import { EXERCISE_BY_SLUG } from "@/lib/strength/library";
import { buildSteps, effectiveSlug, weightStep, type SetLog } from "@/lib/strength/steps";
import type { StrengthProgress, StrengthWorkoutRecord } from "@/lib/strength/data";

const WEIGHT_EQUIPMENT = ["dumbbell", "barbell", "kettlebell", "machine", "cable"];
const mmss = (s: number) => `${String(Math.floor(Math.max(0, s) / 60)).padStart(2, "0")}:${String(Math.max(0, s) % 60).padStart(2, "0")}`;

/** Entreno en vivo: pantalla completa móvil, estado persistido para cerrar y reanudar. */
export function LiveWorkout({
  workout,
  alternatives,
}: {
  workout: StrengthWorkoutRecord;
  alternatives: Record<string, string[]>;
}) {
  const steps = useMemo(() => buildSteps(workout), [workout]);
  const workSteps = useMemo(() => steps.filter((s) => s.kind === "work").length, [steps]);
  const initial = workout.progress;
  const [startedAt] = useState(() => (initial ? new Date(initial.started_at).getTime() : Date.now()));
  const [idx, setIdx] = useState(initial?.step ?? 0);
  const [done, setDone] = useState<Record<string, SetLog[]>>(initial?.done ?? {});
  const [swaps, setSwaps] = useState<Record<string, string>>(initial?.swaps ?? {});
  const [weights, setWeights] = useState<Record<string, number | null>>({});
  const [now, setNow] = useState(() => Date.now());
  const [restLeft, setRestLeft] = useState<number | null>(() => (steps[initial?.step ?? 0]?.kind === "rest" ? (steps[initial?.step ?? 0].rest_s ?? 30) : null));
  const [workLeft, setWorkLeft] = useState<number | null>(() => (steps[initial?.step ?? 0]?.kind === "work" ? (steps[initial?.step ?? 0].seconds ?? null) : null));
  const [showSwap, setShowSwap] = useState(false);
  const [rpe, setRpe] = useState(6);
  const [finished, setFinished] = useState<{ tss: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const finishing = idx >= steps.length;
  // El antídoto de conducción vive en su propia sección (/movilidad), no en Fuerza.
  const isAntidote = workout.name === ANTIDOTE_NAME;
  const backHref = isAntidote ? "/movilidad" : "/fuerza";
  const lastSaved = useRef<string>("");

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const step = steps[idx];
  const isCardio = !!step?.cardio;
  const block = step ? workout.blocks[step.blockIdx] : null;
  const line = step && block ? block.exercises[step.exIdx] : null;
  const slug = line ? effectiveSlug(line.slug, swaps) : null;
  const ex = slug ? EXERCISE_BY_SLUG[slug] : null;
  const key = step?.key ?? "";
  const supportsWeight = !!ex && (ex.equipment.some((e) => WEIGHT_EQUIPMENT.includes(e)) || line?.weight_kg != null);
  const currentWeight = key in weights ? weights[key] : (line?.weight_kg ?? null);

  // Cambiar de paso reinicia las cuentas atrás (sin efectos: se hace en el manejador).
  const go = useCallback(
    (n: number) => {
      const next = steps[n];
      setIdx(n);
      setShowSwap(false);
      setRestLeft(next?.kind === "rest" ? (next.rest_s ?? 30) : null);
      setWorkLeft(next?.kind === "work" ? (next.seconds ?? null) : null);
    },
    [steps]
  );

  useEffect(() => {
    if (restLeft == null) return;
    const t = setTimeout(() => {
      if (restLeft <= 1) go(idx + 1);
      else setRestLeft(restLeft - 1);
    }, 1000);
    return () => clearTimeout(t);
  }, [restLeft, idx, go]);

  useEffect(() => {
    if (workLeft == null || workLeft <= 0) return;
    const t = setTimeout(() => setWorkLeft((r) => (r == null ? r : r - 1)), 1000);
    return () => clearTimeout(t);
  }, [workLeft]);

  const persist = useCallback(
    (nextIdx: number, nextDone: Record<string, SetLog[]>, nextSwaps: Record<string, string>) => {
      const progress: StrengthProgress = { step: nextIdx, done: nextDone, swaps: nextSwaps, started_at: new Date(startedAt).toISOString() };
      const sig = JSON.stringify(progress);
      if (sig === lastSaved.current) return;
      lastSaved.current = sig;
      void saveProgressAction(workout.id, progress);
    },
    [startedAt, workout.id]
  );

  function completeSet() {
    if (!step || !line || !slug || !ex) return;
    const log: SetLog = { reps: step.reps ?? 0, weight_kg: supportsWeight ? currentWeight : null };
    const nextDone = { ...done, [key]: [...(done[key] ?? []), log] };
    setDone(nextDone);
    const next = idx + 1;
    go(next);
    persist(next, nextDone, swaps);
    void logSetAction({
      workoutId: workout.id, slug, name: ex.name_es, setIndex: nextDone[key].length,
      reps: step.reps ?? null, seconds: step.seconds ?? null, weight_kg: log.weight_kg, date: workout.date,
    });
  }

  /** Cardio en cinta: no registra series, solo pasa al siguiente paso. */
  function completeCardio() {
    const next = idx + 1;
    go(next);
    persist(next, done, swaps);
  }

  function swapTo(alt: string) {
    if (!line) return;
    const nextSwaps = { ...swaps, [line.slug]: alt };
    setSwaps(nextSwaps);
    setShowSwap(false);
    persist(idx, done, nextSwaps);
  }

  const totalSets = Object.values(done).reduce((a, l) => a + l.length, 0);
  const volume = Object.values(done).flat().reduce((a, l) => a + (l.weight_kg ?? 0) * l.reps, 0);
  const elapsedS = Math.floor((now - startedAt) / 1000);
  const doneWork = steps.slice(0, Math.min(idx, steps.length)).filter((s) => s.kind === "work").length;

  if (finished) {
    return (
      <Shell title="¡Hecho!">
        <div className="grid gap-4">
          <p className="text-lg">Buen trabajo. Carga de la sesión: <span className="metric font-semibold">{finished.tss} TSS</span>.</p>
          {!isAntidote && <EffortCard workoutId={workout.id} workoutName={workout.name} />}
          <LinkButton href={backHref} variant="secondary">{isAntidote ? "Volver a Movilidad" : "Volver a Fuerza"}</LinkButton>
        </div>
      </Shell>
    );
  }

  if (finishing) {
    return (
      <Shell title="Resumen">
        <div className="grid gap-5">
          <dl className="grid grid-cols-3 gap-3">
            {[["Tiempo", mmss(elapsedS)], ["Series", String(totalSets)], ["Volumen", `${Math.round(volume)} kg`]].map(([k, v]) => (
              <div key={k} className="tile"><dd className="metric text-xl font-semibold">{v}</dd><dt className="text-xs text-label-2">{k}</dt></div>
            ))}
          </dl>
          <fieldset className="grid gap-2">
            <legend className="mb-1 text-sm font-medium">Esfuerzo de la sesión (1 suave – 10 máximo)</legend>
            <SingleChoice name="RPE" value={rpe} onChange={setRpe} options={Array.from({ length: 10 }, (_, i) => ({ value: i + 1, label: String(i + 1) }))} />
          </fieldset>
          <Button
            disabled={pending}
            onClick={() =>
              start(async () => {
                const r = await finishWorkoutAction(workout.id, { rpe, elapsed_min: elapsedS / 60 });
                if (r.ok) setFinished({ tss: r.tss ?? 0 });
                else setError(r.error ?? "No se pudo guardar");
              })
            }
          >
            {pending ? "Guardando…" : "Guardar y terminar"}
          </Button>
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        </div>
      </Shell>
    );
  }

  const nextWork = steps.slice(idx + 1).find((s) => s.kind === "work");
  const nextName = nextWork
    ? nextWork.cardio
      ? "Cardio en cinta"
      : EXERCISE_BY_SLUG[effectiveSlug(workout.blocks[nextWork.blockIdx].exercises[nextWork.exIdx].slug, swaps)]?.name_es
    : null;
  const alts = line ? (alternatives[line.slug] ?? []) : [];

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-bg">
      <header className="glass-bar flex items-center justify-between px-4 py-3" style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}>
        <Link href={backHref} aria-label="Salir (se guarda tu progreso)" className="flex h-11 w-11 items-center justify-center rounded-full bg-fill">
          <X size={20} strokeWidth={1.75} aria-hidden="true" />
        </Link>
        <div className="text-center">
          <p className="text-sm font-medium">{block?.title}{step && step.roundsTotal > 1 ? ` · ronda ${step.round}/${step.roundsTotal}` : ""}</p>
          <p className="metric text-xs text-label-2">{mmss(elapsedS)}</p>
        </div>
        <span className="w-11" />
      </header>
      <div className="px-4 pt-3"><ProgressBar value={doneWork} max={workSteps} label="Progreso de la rutina" /></div>

      {step?.kind === "rest" ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-sm text-label-2">Descanso</p>
          <p className="metric text-7xl font-semibold" role="timer" aria-live="off">{mmss(restLeft ?? 0)}</p>
          {nextName && <p className="text-label-2">Siguiente: <span className="font-medium text-label">{nextName}</span></p>}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setRestLeft((r) => (r ?? 0) + 15)}>+15 s</Button>
            <Button variant="secondary" onClick={() => go(idx + 1)}>Saltar descanso</Button>
          </div>
        </div>
      ) : isCardio ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <Footprints size={44} strokeWidth={1.5} aria-hidden="true" className="text-accent" />
          <h1 className="text-2xl font-semibold" style={{ letterSpacing: "-0.025em" }}>Cardio en cinta</h1>
          <p className="metric text-7xl font-semibold" role="timer" aria-live="off">{mmss(workLeft ?? step?.seconds ?? 0)}</p>
          <p className="max-w-xs text-label-2">Ritmo cómodo: puedes hablar sin ahogarte (zona 2). Activa piernas y corazón antes de las series.</p>
          {workLeft === 0 && <p className="text-sm font-medium text-accent">¡Listo! Pasa a los ejercicios.</p>}
          {nextName && <p className="text-xs text-label-2">Siguiente: {nextName}</p>}
        </div>
      ) : (
        <div className="flex flex-1 flex-col overflow-y-auto px-4 pb-4">
          <div className="mx-auto mt-2 flex min-h-0 w-full max-w-sm flex-1 items-center justify-center" style={{ maxHeight: "44vh" }}>
            {ex && <ExerciseFigure exercise={ex} variant="live" />}
          </div>
          <h1 className="mt-2 text-center text-2xl font-semibold" style={{ letterSpacing: "-0.025em" }}>{ex?.name_es}</h1>
          <p className="mt-1 text-center text-label-2">
            Serie {step?.setNo}/{step?.setsTotal}
          </p>
          <p className="metric mt-2 text-center text-5xl font-semibold">
            {step?.reps != null ? `${step.reps} reps` : mmss(workLeft ?? step?.seconds ?? 0)}
          </p>
          {supportsWeight && (
            <div className="mx-auto mt-4 flex items-center gap-4">
              <button type="button" aria-label="Bajar peso"
                onClick={() => setWeights({ ...weights, [key]: Math.max(0, (currentWeight ?? 0) - weightStep(slug!)) })}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-fill"><Minus size={22} strokeWidth={1.75} aria-hidden="true" /></button>
              <p className="metric min-w-24 text-center text-2xl font-semibold" aria-live="polite">{currentWeight != null ? `${currentWeight} kg` : "— kg"}</p>
              <button type="button" aria-label="Subir peso"
                onClick={() => setWeights({ ...weights, [key]: (currentWeight ?? 0) + weightStep(slug!) })}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-fill"><Plus size={22} strokeWidth={1.75} aria-hidden="true" /></button>
            </div>
          )}
          {line?.note && <p className="mt-3 text-center text-sm text-accent">{line.note}</p>}
          {ex && <p className="mt-3 text-center text-sm text-label-2">{ex.cues_es[0]}</p>}
          {alts.length > 0 && (
            <div className="mt-3 text-center">
              <button type="button" onClick={() => setShowSwap(!showSwap)} aria-expanded={showSwap}
                className="inline-flex min-h-11 items-center gap-2 text-sm text-accent">
                <ArrowLeftRight size={18} strokeWidth={1.75} aria-hidden="true" /> Cambiar ejercicio
              </button>
              {showSwap && (
                <ul className="mx-auto mt-2 grid max-w-sm gap-2">
                  {alts.map((a) => (
                    <li key={a}><Button variant="secondary" className="w-full" onClick={() => swapTo(a)}>{EXERCISE_BY_SLUG[a]?.name_es}</Button></li>
                  ))}
                  {line && swaps[line.slug] && (
                    <li><Button variant="ghost" className="w-full" onClick={() => { const n = { ...swaps }; delete n[line.slug]; setSwaps(n); setShowSwap(false); persist(idx, done, n); }}>Volver al original</Button></li>
                  )}
                </ul>
              )}
            </div>
          )}
          {nextName && <p className="mt-4 text-center text-xs text-label-2">Siguiente: {nextName}</p>}
        </div>
      )}

      {step?.kind === "work" && (
        <div className="glass-bar px-4 pt-3" style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}>
          <Button className="w-full !min-h-14 text-base" onClick={isCardio ? completeCardio : completeSet}>
            <Check size={22} strokeWidth={1.75} aria-hidden="true" className="mr-2" /> {isCardio ? "Cardio hecho" : "Serie hecha"}
          </Button>
        </div>
      )}
    </div>
  );
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-lg px-4 py-10">
      <h1 className="mb-6 text-3xl font-semibold" style={{ letterSpacing: "-0.025em" }}>{title}</h1>
      {children}
    </div>
  );
}
