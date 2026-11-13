import { notFound } from "next/navigation";
import { ANIMATION_MAP, loadRigFor } from "@/lib/exercises/animation-map";
import { evalPose } from "@/lib/exercises/rig/interpolate";
import { RigStage } from "@/components/exercises/RigStage";
import { validateRig } from "@/lib/exercises/rig/validate";

/**
 * Galería de FOTOGRAMAS de todas las animaciones del mapa (revisión visual de los rigs). Solo con UI_PREVIEW=1 (local/capturas).
 * ?de=0&n=6 → qué trozo de la lista. ?t=0,0.3,0.5,0.75 → instantes a mostrar.
 */
export default async function Page({ searchParams }: { searchParams: Promise<{ de?: string; n?: string; t?: string }> }) {
  if (process.env.UI_PREVIEW !== "1" && process.env.NODE_ENV === "production") notFound();
  const { de = "0", n = "6", t = "0,0.3,0.5,0.8" } = await searchParams;
  const times = t.split(",").map(Number);
  const keys = Object.keys(ANIMATION_MAP).slice(Number(de), Number(de) + Number(n));
  const rows = await Promise.all(keys.map(async (key) => ({ key, rig: await loadRigFor(key.split("/")[0], key.split("/").slice(1).join("/")) })));
  return (
    <main className="space-y-4 p-3" style={{ width: 1100 }}>
      {rows.map(({ key, rig }) =>
        rig ? (
          <section key={key}>
            <p className="mb-1 font-mono text-xs">
              {key} — {rig.title_es} {validateRig(rig).issues.filter((i) => i.level === "error").length > 0 ? "⚠ ERRORES" : ""}
            </p>
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${times.length}, 1fr)` }}>
              {times.map((tt) => (
                <div key={tt} className="data-surface !p-1">
                  <RigStage rig={rig} joints={evalPose(rig.poses, tt, rig.interpolation ?? "eased")} muscleOpacity={0.5} label={`${rig.title_es} t=${tt}`} />
                </div>
              ))}
            </div>
          </section>
        ) : (
          <p key={key}>{key}: sin rig</p>
        ),
      )}
    </main>
  );
}
