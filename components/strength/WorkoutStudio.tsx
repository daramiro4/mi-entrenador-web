"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell, Send, Sparkles } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { GlassCard } from "@/components/ui/GlassCard";
import { SingleChoice } from "@/components/ui/Choice";
import { EmptyState } from "@/components/ui/EmptyState";
import { generateWorkoutAction } from "@/app/fuerza/actions";
import { FORMATS } from "@/lib/strength/formats";
import { FORMAT_LABEL } from "@/lib/strength/labels";
import { mainExercises } from "@/lib/strength/describe";
import type { StrengthWorkoutRecord } from "@/lib/strength/data";
import type { FormatSlug } from "@/lib/strength/types";
import { SendToForerunner } from "./SendToForerunner";

/** Selector de formato + tarjeta del workout de hoy. */
export function WorkoutStudio({ workout, defaultFormat }: { workout: StrengthWorkoutRecord | null; defaultFormat: FormatSlug }) {
  const router = useRouter();
  const [format, setFormat] = useState<FormatSlug>(defaultFormat);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function generate() {
    setError(null);
    start(async () => {
      const r = await generateWorkoutAction(format);
      if (!r.ok) setError(r.message);
      else router.refresh();
    });
  }

  const blurb = FORMATS.find((f) => f.slug === format)?.blurb;
  const n = workout ? mainExercises(workout.blocks).length : 0;

  return (
    <GlassCard aria-labelledby="studio-title">
      <h2 id="studio-title" className="text-lg font-semibold">Estudio de fuerza</h2>
      <div className="mt-4 grid gap-2">
        <p className="text-sm font-medium">Formato</p>
        <SingleChoice<FormatSlug> name="Formato" value={format} onChange={setFormat}
          options={FORMATS.map((f) => ({ value: f.slug, label: FORMAT_LABEL[f.slug] }))} />
        <p className="text-sm text-label-2">{blurb}</p>
      </div>

      <div className="tile mt-5">
        {workout ? (
          <>
            <p className="text-xs text-label-2">Tu workout de hoy</p>
            <p className="mt-1 text-2xl font-semibold" style={{ letterSpacing: "-0.025em" }}>{workout.name}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Chip tone="accent">{FORMAT_LABEL[workout.format as FormatSlug] ?? workout.format}</Chip>
              <Chip>{workout.duration_min} min</Chip>
              <Chip>{n} ejercicios</Chip>
              {workout.intensity && <Chip>Intensidad {workout.intensity}</Chip>}
              {workout.status === "done" && <Chip tone="success">Hecho</Chip>}
              {workout.status === "in_progress" && <Chip tone="warning">En curso</Chip>}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {workout.status !== "done" && (
                <LinkButton href={`/fuerza/entreno/${workout.id}`}>
                  <Dumbbell size={18} strokeWidth={1.75} aria-hidden="true" className="mr-2" />
                  {workout.status === "in_progress" ? "Continuar" : "Empezar"}
                </LinkButton>
              )}
              <SendToForerunner workoutId={workout.id} />
              <Button variant="secondary" onClick={generate} disabled={pending}>
                <Sparkles size={18} strokeWidth={1.75} aria-hidden="true" className="mr-2" />
                {pending ? "Generando…" : "Generar otra"}
              </Button>
            </div>
          </>
        ) : (
          <EmptyState icon={Dumbbell} text="Aún no tienes ninguna rutina. Elige un formato y genera la primera.">
            <Button onClick={generate} disabled={pending}>
              <Send size={18} strokeWidth={1.75} aria-hidden="true" className="mr-2" />
              {pending ? "Generando…" : "Generar rutina"}
            </Button>
          </EmptyState>
        )}
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
    </GlassCard>
  );
}
