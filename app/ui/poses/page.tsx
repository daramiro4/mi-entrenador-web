import { AppShell } from "@/components/ui/AppShell";
import { ExerciseCard } from "@/components/strength/ExerciseCard";
import { EXERCISES } from "@/lib/strength/library";

export default function PosesGallery() {
  return (
    <AppShell active="fuerza">
      <h1 className="mb-6 text-3xl font-semibold">Biblioteca de ejercicios ({EXERCISES.length})</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {EXERCISES.map((e) => (
          <ExerciseCard key={e.slug} exercise={e} />
        ))}
      </div>
    </AppShell>
  );
}
