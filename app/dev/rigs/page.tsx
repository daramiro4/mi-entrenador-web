import { notFound } from "next/navigation";
import { AppShell } from "@/components/ui/AppShell";
import { RigStage } from "@/components/exercises/RigStage";
import { RigWorkbench } from "@/components/exercises/dev/RigWorkbench";
import { ExerciseAnimation } from "@/components/exercises/ExerciseAnimation";
import { ExerciseStaticPoses } from "@/components/exercises/ExerciseStaticPoses";
import { ANIMATION_MAP, loadRigFor } from "@/lib/exercises/animation-map";
import { evalRig, muscleOpacityAt } from "@/lib/exercises/rig/interpolate";
import type { Rig } from "@/lib/exercises/rig/types";

/** Herramienta de desarrollo de rigs. No existe en producción. */
export default async function DevRigsPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const rigs: Rig[] = [];
  for (const key of Object.keys(ANIMATION_MAP)) {
    const [category, name] = key.split("/");
    const rig = await loadRigFor(category, name);
    if (rig && !rigs.some((r) => r.id === rig.id)) rigs.push(rig);
  }
  const frames = [0, 0.3, 0.52, 0.8];
  const reference = rigs.find((r) => r.id.startsWith("quadruped_rotation")) ?? rigs[0];

  return (
    <AppShell active={null}>
      <h1 className="mb-2 text-3xl">Rigs de ejercicios</h1>
      <p className="mb-8 max-w-[65ch] text-sm text-label-2">
        Herramienta de desarrollo (no existe en producción). Fotogramas de cada rig, reproductor, ficha de respaldo y editor de poses.
      </p>

      <section aria-labelledby="ref-title" className="mb-10">
        <h2 id="ref-title" className="mb-3 text-2xl">Reproductor: {reference.title_es}</h2>
        <div className="max-w-2xl"><ExerciseAnimation rig={reference} /></div>
      </section>

      <section aria-labelledby="big-title" className="mb-10">
        <h2 id="big-title" className="mb-3 text-2xl">Rotación torácica en grande</h2>
        <div className="grid max-w-4xl grid-cols-2 gap-3">
          {[0, 0.28, 0.52, 0.82].map((t) => (
            <figure key={t} className="data-surface !p-3">
              <RigStage rig={reference} joints={evalRig(reference, t)} muscleOpacity={muscleOpacityAt(reference.phases, t)} label={`${reference.title_es} en t=${t}`} />
              <figcaption className="text-center font-mono text-xs text-label-2">t = {t}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section aria-labelledby="frames-title" className="mb-10">
        <h2 id="frames-title" className="mb-3 text-2xl">Fotogramas</h2>
        <div className="space-y-6">
          {rigs.map((rig) => (
            <div key={rig.id}>
              <h3 className="mb-2 text-lg"><span className="font-mono text-sm text-label-2">{rig.id}</span> · {rig.title_es}</h3>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {frames.map((t) => (
                  <figure key={t} className="data-surface !p-2">
                    <RigStage rig={rig} joints={evalRig(rig, t)} muscleOpacity={muscleOpacityAt(rig.phases, t)} label={`${rig.title_es} en t=${t}`} />
                    <figcaption className="text-center font-mono text-xs text-label-2">t = {t}</figcaption>
                  </figure>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="static-title" className="mb-10">
        <h2 id="static-title" className="mb-3 text-2xl">Ficha de respaldo (sin animación)</h2>
        <div className="max-w-2xl"><ExerciseStaticPoses rig={rigs.find((r) => r.id.startsWith("squat:goblet")) ?? rigs[0]} dose={{ type: "reps", reps: 10 }} /></div>
      </section>

      <section aria-labelledby="wb-title">
        <h2 id="wb-title" className="mb-3 text-2xl">Editor</h2>
        <RigWorkbench rigs={rigs} />
      </section>
    </AppShell>
  );
}
