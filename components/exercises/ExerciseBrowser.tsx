"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import type { CategoryRow, ExerciseListRow } from "@/lib/exercises/ui-types";
import { rowKey } from "@/lib/exercises/ui-types";
import { buildFacets, buildIndex, EMPTY_FILTERS, searchExercises, type Filters } from "@/lib/exercises/search";
import { hasAnimation } from "@/lib/exercises/animation-map";
import { equipmentLabel, levelShort } from "@/lib/exercises/labels";
import { ExerciseFilters } from "./ExerciseFilters";
import { ExerciseThumb } from "./ExerciseThumb";
import { VirtualList } from "./VirtualList";

const ROW_HEIGHT = 76;

const subscribeResize = (cb: () => void) => {
  window.addEventListener("resize", cb);
  return () => window.removeEventListener("resize", cb);
};
const innerHeight = () => window.innerHeight;

/** Búsqueda + filtros + lista virtualizada. La usan la página /ejercicios y el ExercisePicker. */
export function ExerciseBrowser({
  rows,
  categories,
  onSelect,
  activeId,
  initialFilters = EMPTY_FILTERS,
  reservedHeight = 360,
}: {
  rows: ExerciseListRow[];
  categories: CategoryRow[];
  onSelect: (row: ExerciseListRow) => void;
  activeId?: string | null;
  initialFilters?: Filters;
  /** Alto que ocupa lo que hay encima de la lista (cabecera + filtros): el resto del viewport es la lista. */
  reservedHeight?: number;
}) {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const categoryNames = useMemo(() => Object.fromEntries(categories.map((c) => [c.garmin_category, c.name_es])), [categories]);
  const index = useMemo(() => buildIndex(rows, categoryNames), [rows, categoryNames]);
  const facets = useMemo(() => buildFacets(rows), [rows]);
  const results = useMemo(() => searchExercises(index, filters, (r) => hasAnimation(r.garmin_category, r.garmin_name)), [index, filters]);
  const viewport = useSyncExternalStore(subscribeResize, innerHeight, () => 800);
  const height = Math.min(760, Math.max(360, viewport - reservedHeight));

  return (
    <div>
      <ExerciseFilters filters={filters} onChange={setFilters} facets={facets} categoryNames={categoryNames} total={rows.length} shown={results.length} />
      <div className="mt-3">
        <VirtualList
          items={results}
          itemHeight={ROW_HEIGHT}
          height={height}
          label="Ejercicios"
          getKey={rowKey}
          activeKey={activeId ? (rows.find((r) => r.id === activeId) ? rowKey(rows.find((r) => r.id === activeId)!) : null) : null}
          onSelect={onSelect}
          empty={<p className="py-10 text-center text-base text-label-2">Ningún ejercicio coincide. Prueba con otra palabra o limpia los filtros.</p>}
          renderRow={(r) => (
            <div className="flex h-full items-center gap-3 px-3">
              <ExerciseThumb category={r.garmin_category} name={r.garmin_name} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-medium">{r.name_es}</p>
                {r.name_en !== r.name_es && <p className="truncate text-xs text-label-2">{r.name_en}</p>}
                <p className="mt-0.5 truncate font-mono text-[11px] uppercase tracking-wide text-label-2">
                  {categoryNames[r.garmin_category] ?? r.garmin_category} · {levelShort(r.level)} · {equipmentLabel(r.equipment[0] ?? "unknown")}
                </p>
              </div>
              {r.review_status === "reviewed" ? (
                <span className="shrink-0 rounded-full border border-separator px-2 py-0.5 text-[11px] text-volt">Revisado</span>
              ) : r.level !== null ? (
                <span className="shrink-0 rounded-full border border-separator px-2 py-0.5 text-[11px] text-label-2">Borrador</span>
              ) : null}
            </div>
          )}
        />
      </div>
    </div>
  );
}
