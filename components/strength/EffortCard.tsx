"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Gauge } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { MultiChoice, SingleChoice } from "@/components/ui/Choice";
import { submitEffortAction } from "@/app/fuerza/actions";
import { AREA_LABEL } from "@/lib/strength/labels";
import { EFFORT_NEXT_TIME } from "@/lib/strength/describe";
import type { Contraindication } from "@/lib/strength/types";

type Felt = "easy" | "ok" | "hard";

/** Esfuerzo percibido de la última rutina + molestias, con aviso de lo que pasará la próxima vez. */
export function EffortCard({ workoutId, workoutName }: { workoutId: string; workoutName: string }) {
  const router = useRouter();
  const [felt, setFelt] = useState<Felt>("ok");
  const [areas, setAreas] = useState<Contraindication[]>([]);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <GlassCard aria-labelledby="ef-title">
      <div className="flex items-center gap-2">
        <Gauge size={20} strokeWidth={1.75} aria-hidden="true" />
        <h2 id="ef-title" className="text-lg font-semibold">¿Cómo te fue?</h2>
      </div>
      <p className="mt-1 text-sm text-label-2">{workoutName}</p>
      {done ? (
        <p role="status" className="mt-4 text-sm">{EFFORT_NEXT_TIME[felt]}</p>
      ) : (
        <div className="mt-4 grid gap-4">
          <SingleChoice<Felt> name="Esfuerzo percibido" value={felt} onChange={setFelt}
            options={[{ value: "easy", label: "Fácil" }, { value: "ok", label: "Justo" }, { value: "hard", label: "Duro" }]} />
          <p className="text-sm text-label-2">{EFFORT_NEXT_TIME[felt]}</p>
          <fieldset className="grid gap-2">
            <legend className="mb-1 text-sm font-medium">¿Alguna molestia? (opcional)</legend>
            <MultiChoice<Contraindication> name="Molestias" values={areas} onChange={setAreas}
              options={(Object.keys(AREA_LABEL) as Contraindication[]).map((a) => ({ value: a, label: AREA_LABEL[a] }))} />
            {areas.length > 0 && (
              <p className="text-xs text-label-2">
                Evitaremos ejercicios que carguen esas zonas hasta que las limpies en tus preferencias. Si el dolor persiste, consulta con un fisioterapeuta.
              </p>
            )}
          </fieldset>
          <div>
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const r = await submitEffortAction({ workoutId, felt, discomfort: areas });
                  if (r.ok) { setDone(true); router.refresh(); } else setError(r.error ?? "Error");
                })
              }
            >
              {pending ? "Guardando…" : "Guardar"}
            </Button>
          </div>
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        </div>
      )}
    </GlassCard>
  );
}
