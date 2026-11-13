import { DrivingAntidoteCard } from "./DrivingAntidoteCard";
import { ExerciseList } from "./ExerciseList";
import { GlassCard } from "@/components/ui/GlassCard";
import { drivingAntidote } from "@/lib/strength/antidote";

/** Contenido de /movilidad: la rutina fija del antídoto de conducción, para hacer en casa (separada de la fuerza del gimnasio). */
export function MovilidadView({ lastMonth }: { lastMonth: number | null }) {
  const antidote = drivingAntidote();
  return (
    <>
      <header className="mb-6">
        <h1 className="text-3xl font-semibold sm:text-4xl" style={{ letterSpacing: "-0.025em" }}>Movilidad</h1>
        <p className="mt-1 max-w-[65ch] text-sm text-label-2">
          Una rutina corta para hacer en casa, sin gimnasio, que compensa las horas sentado al volante. Esta app no sustituye a un profesional; si el dolor persiste, consulta con un fisioterapeuta.
        </p>
      </header>
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="grid content-start gap-6">
          <ExerciseList blocks={antidote.blocks} />
        </div>
        <div className="grid content-start gap-6">
          <DrivingAntidoteCard />
          {lastMonth != null && (
            <GlassCard>
              <p className="text-sm text-label-2">Últimos 30 días</p>
              <p className="metric mt-1 text-3xl font-semibold">{lastMonth}</p>
              <p className="text-sm text-label-2">{lastMonth === 1 ? "vez completada" : "veces completada"}</p>
            </GlassCard>
          )}
        </div>
      </div>
    </>
  );
}
