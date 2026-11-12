import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/ui/AppShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { WorkoutStudio } from "@/components/strength/WorkoutStudio";
import { ExerciseList } from "@/components/strength/ExerciseList";
import { PatternProgress, patternVolume } from "@/components/strength/PatternProgress";
import { DrivingAntidoteCard } from "@/components/strength/DrivingAntidoteCard";
import { EffortCard } from "@/components/strength/EffortCard";
import { PrefsForm } from "@/components/strength/PrefsForm";
import { PrefsPanel } from "@/components/strength/PrefsPanel";
import { DEFAULT_PREFS, getPrefs, getRecentWorkouts } from "@/lib/strength/data";
import { addDays, todayISODate } from "@/lib/week";
import { garminSendEnabled } from "@/lib/strength/garmin-send";

export default async function FuerzaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = todayISODate();
  const [{ prefs, missing }, recent] = await Promise.all([
    getPrefs(supabase, user.id),
    getRecentWorkouts(supabase, user.id, 20),
  ]);

  if (missing || recent.missing) {
    return (
      <AppShell active="fuerza">
        <h1 className="mb-6 text-3xl font-semibold">Fuerza</h1>
        <GlassCard>
          <EmptyState icon={AlertCircle} text="El módulo de fuerza necesita sus tablas en la base de datos. Aplica las migraciones de supabase/migrations (20261101…) y recarga." />
        </GlassCard>
      </AppShell>
    );
  }

  const workouts = recent.rows.filter((w) => !(w.name === "Antídoto de conducción"));
  const todays =
    workouts.find((w) => w.date === today && w.status !== "skipped") ?? workouts.find((w) => w.status !== "done" && w.status !== "skipped") ?? null;
  const lastDoneNoEffort = workouts.find((w) => w.status === "done" && !w.felt) ?? null;
  const volume = patternVolume(recent.rows, addDays(today, -28));

  return (
    <AppShell active="fuerza">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold sm:text-4xl" style={{ letterSpacing: "-0.025em" }}>Fuerza</h1>
        <p className="mt-1 text-sm text-label-2">
          Fuerza por salud: compensa las horas sentado y protege tu espalda. Esta app no sustituye a un profesional; si el dolor persiste, consulta con un fisioterapeuta.
        </p>
        <Link href="/ejercicios" className="mt-2 inline-flex min-h-11 items-center text-sm text-accent hover:underline">
          Biblioteca de ejercicios
        </Link>
      </header>

      {!prefs ? (
        <GlassCard aria-labelledby="q-title">
          <h2 id="q-title" className="text-lg font-semibold">Cuéntanos sobre ti</h2>
          <p className="mb-5 mt-1 text-sm text-label-2">Unas preguntas para adaptar las rutinas a tu equipamiento y a tus molestias.</p>
          <PrefsForm initial={DEFAULT_PREFS} />
        </GlassCard>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="grid content-start gap-6">
            <WorkoutStudio workout={todays} defaultFormat="completa" garminEnabled={garminSendEnabled()} />
            {todays && <ExerciseList blocks={todays.blocks} />}
          </div>
          <div className="grid content-start gap-6">
            {lastDoneNoEffort && <EffortCard workoutId={lastDoneNoEffort.id} workoutName={lastDoneNoEffort.name} />}
            <PatternProgress volume={volume} />
            <DrivingAntidoteCard />
            <PrefsPanel prefs={prefs} />
          </div>
        </div>
      )}
    </AppShell>
  );
}
