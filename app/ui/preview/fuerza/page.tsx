import { notFound } from "next/navigation";
import { AppShell } from "@/components/ui/AppShell";
import { WorkoutStudio } from "@/components/strength/WorkoutStudio";
import { ExerciseList } from "@/components/strength/ExerciseList";
import { PatternProgress } from "@/components/strength/PatternProgress";
import { DrivingAntidoteCard } from "@/components/strength/DrivingAntidoteCard";
import { EffortCard } from "@/components/strength/EffortCard";
import * as fx from "../fixtures";

export default function PreviewFuerza() {
  if (process.env.UI_PREVIEW !== "1" && process.env.NODE_ENV === "production") notFound();
  return (
    <AppShell active="fuerza">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold sm:text-4xl" style={{ letterSpacing: "-0.025em" }}>Fuerza</h1>
        <p className="mt-1 text-sm text-label-2">Fuerza por salud: compensa las horas sentado y protege tu espalda. Esta app no sustituye a un profesional; si el dolor persiste, consulta con un fisioterapeuta.</p>
      </header>
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="grid content-start gap-6">
          <WorkoutStudio workout={fx.strengthWorkout} defaultFormat="circuito" garminEnabled={false} />
          <ExerciseList blocks={fx.strengthWorkout.blocks} />
        </div>
        <div className="grid content-start gap-6">
          <EffortCard workoutId="x" workoutName="Carretera larga" />
          <PatternProgress volume={{ hinge: 18, pull: 24, push: 16, core: 12, squat: 14 }} />
          <DrivingAntidoteCard />
        </div>
      </div>
    </AppShell>
  );
}
