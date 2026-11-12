"use client";

import { ChevronDown, ChevronUp, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createWorkoutAction, updateWorkoutAction } from "@/app/workouts/actions";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { RadioGroup } from "@/components/ui/RadioGroup";
import { NumberInput, TextInput } from "@/components/ui/TextInput";
import { TextArea } from "@/components/ui/TextArea";
import { WORKOUT_STEP_KIND_LABEL, WORKOUT_TYPE_LABEL } from "@/lib/labels";
import type { Workout, WorkoutStep, WorkoutStepKind, WorkoutType } from "@/lib/types";

const TYPE_OPTIONS = (Object.keys(WORKOUT_TYPE_LABEL) as WorkoutType[]).map((value) => ({
  value,
  label: WORKOUT_TYPE_LABEL[value],
}));

const STEP_KIND_OPTIONS = Object.keys(WORKOUT_STEP_KIND_LABEL) as WorkoutStepKind[];

const SELECT_CLASSES =
  "w-full bg-steel border border-fog/30 rounded-sm px-3 py-2 text-paper text-sm focus:outline-none focus:border-volt transition-colors";

function emptyStep(): WorkoutStep {
  return { kind: "interval", duration_seconds: 300, target_low_pct_ftp: 90, target_high_pct_ftp: 100 };
}

function isStepValid(step: WorkoutStep): boolean {
  return step.duration_seconds > 0 && step.target_high_pct_ftp >= step.target_low_pct_ftp;
}

export function WorkoutForm({
  mode,
  workout,
}: {
  mode: "create" | "edit";
  workout?: Workout;
}) {
  const router = useRouter();
  const [name, setName] = useState(workout?.name ?? "");
  const [type, setType] = useState<WorkoutType | null>(workout?.type ?? null);
  const [notes, setNotes] = useState(workout?.notes ?? "");
  const [steps, setSteps] = useState<WorkoutStep[]>(workout?.intervals ?? []);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateStep(index: number, patch: Partial<WorkoutStep>) {
    setSteps((prev) => prev.map((step, i) => (i === index ? { ...step, ...patch } : step)));
  }

  function removeStep(index: number) {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  }

  function moveStep(index: number, direction: -1 | 1) {
    setSteps((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  const canSubmit =
    name.trim() !== "" && type !== null && steps.length > 0 && steps.every(isStepValid);

  function handleSubmit() {
    if (!canSubmit || type === null) return;
    setError(null);

    const input = {
      name: name.trim(),
      type,
      notes: notes.trim() || null,
      intervals: steps,
    };

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createWorkoutAction(input)
          : await updateWorkoutAction(workout!.id, input);

      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/workouts");
    });
  }

  return (
    <div className="space-y-8">
      <Field label="Nombre">
        <TextInput
          placeholder="Ej. Series de VO2max 5x4"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>

      <Field label="Tipo">
        <RadioGroup name="type" options={TYPE_OPTIONS} value={type} onChange={setType} />
      </Field>

      <Field label="Notas" hint="Opcional">
        <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>

      <div className="space-y-3">
        <span className="block font-display text-xl text-paper leading-none">
          Pasos
        </span>

        {steps.length === 0 && <p className="text-sm text-fog">Aún no hay pasos.</p>}

        <div className="space-y-2">
          {steps.map((step, index) => (
            <div
              key={index}
              className="data-surface grid grid-cols-3 items-end gap-2 p-3 sm:grid-cols-[1.4fr_1fr_1fr_1fr_auto]"
            >
              <label className="col-span-3 space-y-1 sm:col-span-1">
                <span className="text-xs text-label-2">Tipo de paso</span>
                <select
                  className={SELECT_CLASSES}
                  value={step.kind}
                  onChange={(e) => updateStep(index, { kind: e.target.value as WorkoutStepKind })}
                >
                  {STEP_KIND_OPTIONS.map((kind) => (
                    <option key={kind} value={kind}>
                      {WORKOUT_STEP_KIND_LABEL[kind]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-xs text-label-2">Duración (s)</span>
                <NumberInput
                  value={step.duration_seconds}
                  onChange={(e) => updateStep(index, { duration_seconds: Number(e.target.value) })}
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs text-label-2">% FTP mín.</span>
                <NumberInput
                  value={step.target_low_pct_ftp}
                  onChange={(e) =>
                    updateStep(index, { target_low_pct_ftp: Number(e.target.value) })
                  }
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs text-label-2">% FTP máx.</span>
                <NumberInput
                  value={step.target_high_pct_ftp}
                  onChange={(e) =>
                    updateStep(index, { target_high_pct_ftp: Number(e.target.value) })
                  }
                />
              </label>

              <div className="col-span-3 flex justify-end gap-1 sm:col-span-1">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => moveStep(index, -1)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full text-label-2 hover:bg-fill hover:text-label disabled:pointer-events-none disabled:opacity-30 cursor-pointer"
                  aria-label="Subir paso"
                >
                  <ChevronUp size={18} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  disabled={index === steps.length - 1}
                  onClick={() => moveStep(index, 1)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full text-label-2 hover:bg-fill hover:text-label disabled:pointer-events-none disabled:opacity-30 cursor-pointer"
                  aria-label="Bajar paso"
                >
                  <ChevronDown size={18} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => removeStep(index)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full text-danger hover:bg-fill cursor-pointer"
                  aria-label="Quitar paso"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
              {!isStepValid(step) && (
                <p className="col-span-5 text-xs text-fatiga">
                  Duración &gt; 0 y % FTP máx. ≥ % FTP mín.
                </p>
              )}
            </div>
          ))}
        </div>

        <Button variant="secondary" onClick={() => setSteps((prev) => [...prev, emptyStep()])}>
          Añadir paso
        </Button>
      </div>

      {error && <p className="text-sm text-fatiga">{error}</p>}

      <div className="flex gap-3">
        <Button onClick={handleSubmit} disabled={!canSubmit || isPending}>
          {isPending ? "Guardando..." : mode === "create" ? "Crear plantilla" : "Guardar cambios"}
        </Button>
        <Button variant="ghost" onClick={() => router.push("/workouts")} disabled={isPending}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
