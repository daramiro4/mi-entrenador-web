"use client";

import Link from "next/link";
import { ChevronDown, Dumbbell } from "lucide-react";
import type { ExerciseDetail } from "@/lib/exercises/ui-types";
import { equipmentList, levelShort, muscleLabel } from "@/lib/exercises/labels";
import { watchKey } from "@/lib/exercises/watch-key";
import { ExerciseAnimation } from "./ExerciseAnimation";
import { DoseRing } from "./DoseRing";
import { useRig } from "./use-rig";

export interface AlternativeLink {
  key: string;
  name: string;
  /** Página completa del ejercicio. */
  href?: string;
  /** En la hoja de detalle: abrir esa ficha sin salir de la lista. */
  onOpen?: () => void;
}

/**
 * Ficha de un ejercicio: escenario animado con el subtítulo de la fase, metadatos, título, dosis con anillo, "Cómo hacerlo"
 * numerado y sincronizado con la fase, error común y alternativas plegables, y la clave del reloj al pie.
 * Los rigs se cargan bajo demanda; un ejercicio sin animación muestra su ficha de datos.
 */
export function ExerciseDetailView({
  detail,
  categoryName,
  alternatives,
  headingLevel = 1,
}: {
  detail: ExerciseDetail;
  categoryName: string;
  alternatives: AlternativeLink[];
  headingLevel?: 1 | 2;
}) {
  const { rig, loading } = useRig(detail.garmin_category, detail.garmin_name);
  const Heading = headingLevel === 1 ? "h1" : "h2";
  const rigHasSteps = !!rig?.phases.some((p) => p.step_es);
  const muscles = detail.primary_muscles.map(muscleLabel);
  const secondary = detail.secondary_muscles.map(muscleLabel);

  const below = (
    <div className="mt-5">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs uppercase tracking-wider text-label-2">
        <span>{categoryName}</span>
        <span aria-hidden="true">·</span>
        <span>{levelShort(detail.level)}</span>
        <span aria-hidden="true">·</span>
        <span>{equipmentList(detail.equipment)}</span>
      </p>
      <Heading className="mt-2 font-display text-[40px] font-bold leading-[1.05]">{detail.name_es}</Heading>
      {detail.name_en !== detail.name_es && <p className="mt-1 text-sm text-label-2">{detail.name_en}</p>}
      {detail.review_status === "draft" && (
        <p className="mt-3 inline-flex rounded-full border border-separator px-3 py-1 text-xs text-label-2">Borrador: contenido pendiente de revisión</p>
      )}
      {(muscles.length > 0 || secondary.length > 0) && (
        <p className="mt-3 text-sm text-label-2">
          {muscles.length > 0 && (
            <>
              Trabaja: <span className="text-volt">{muscles.join(", ")}</span>
            </>
          )}
          {secondary.length > 0 && <span> · Apoyo: {secondary.join(", ")}</span>}
        </p>
      )}
      {detail.dose_default && (
        <div className="mt-5">
          <h2 className="mb-2 text-lg">Dosis</h2>
          <DoseRing dose={detail.dose_default} />
        </div>
      )}
      {!rigHasSteps && detail.cues.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 text-lg">Cómo hacerlo</h2>
          <ol className="space-y-2">
            {detail.cues.map((c, i) => (
              <li key={i} className="flex gap-3 rounded-[12px] border border-separator px-3 py-2 text-base">
                <span className="font-mono text-sm leading-6 text-label-2">{i + 1}</span>
                <span>{c}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
      {rigHasSteps && <h2 className="mb-2 mt-6 text-lg">Cómo hacerlo</h2>}
    </div>
  );

  return (
    <article aria-label={detail.name_es}>
      {rig ? (
        <ExerciseAnimation rig={rig} showSteps={rigHasSteps} below={below} />
      ) : (
        <>
          <div className="data-surface flex min-h-[200px] flex-col items-center justify-center gap-2 text-center text-label-2" role="img" aria-label={loading ? "Cargando la animación" : "Este ejercicio aún no tiene animación"}>
            <Dumbbell size={36} strokeWidth={1.25} aria-hidden="true" />
            <p className="text-sm">{loading ? "Cargando animación…" : "Aún sin animación"}</p>
          </div>
          {below}
        </>
      )}

      {(detail.common_mistake || alternatives.length > 0) && (
        <div className="mt-6 space-y-2">
          {detail.common_mistake && (
            <details className="group rounded-[12px] border border-separator">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between px-3 text-base [&::-webkit-details-marker]:hidden">
                Error común
                <ChevronDown size={18} aria-hidden="true" className="text-label-2 transition-transform group-open:rotate-180" />
              </summary>
              <p className="px-3 pb-3 text-base text-label-2">{detail.common_mistake}</p>
            </details>
          )}
          {alternatives.length > 0 && (
            <details className="group rounded-[12px] border border-separator">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between px-3 text-base [&::-webkit-details-marker]:hidden">
                Alternativas
                <ChevronDown size={18} aria-hidden="true" className="text-label-2 transition-transform group-open:rotate-180" />
              </summary>
              <ul className="px-1 pb-2">
                {alternatives.map((a) => (
                  <li key={a.key}>
                    {a.onOpen ? (
                      <button type="button" onClick={a.onOpen} className="flex min-h-11 w-full items-center rounded-[12px] px-2 text-left text-base text-accent hover:bg-fill">
                        {a.name}
                      </button>
                    ) : a.href ? (
                      <Link href={a.href} className="flex min-h-11 items-center rounded-[12px] px-2 text-base text-accent hover:bg-fill">
                        {a.name}
                      </Link>
                    ) : (
                      <span className="flex min-h-11 items-center px-2 text-base">{a.name}</span>
                    )}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      <p className="mt-6 border-t border-separator pt-4 font-mono text-xs text-label-2">{watchKey(detail.garmin_category, detail.garmin_name)}</p>
    </article>
  );
}
