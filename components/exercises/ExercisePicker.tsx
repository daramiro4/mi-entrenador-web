"use client";

import type { CategoryRow, ExerciseListRow } from "@/lib/exercises/ui-types";
import { EMPTY_FILTERS, type Filters } from "@/lib/exercises/search";
import { ExerciseBrowser } from "./ExerciseBrowser";
import { ExerciseSheet } from "./ExerciseSheet";

/**
 * Selector de ejercicio para el módulo de fuerza (y cualquier pantalla que necesite elegir uno): búsqueda ES/EN, filtros y la
 * misma lista virtualizada, dentro de una hoja. Llama a `onPick` con la fila elegida y se cierra.
 * Los datos los aporta quien lo usa (`rows`/`categories`; p. ej. con `fetchCatalogList`), así el picker no impone de dónde salen.
 */
export function ExercisePicker({
  open,
  onClose,
  onPick,
  rows,
  categories,
  title = "Elegir ejercicio",
  onlyReviewed = false,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (row: ExerciseListRow) => void;
  rows: ExerciseListRow[];
  categories: CategoryRow[];
  title?: string;
  /** Muestra solo fichas revisadas (lo que el futuro motor de plan podrá proponer). */
  onlyReviewed?: boolean;
}) {
  const initial: Filters = { ...EMPTY_FILTERS, onlyReviewed };
  return (
    <ExerciseSheet open={open} onClose={onClose} label={title}>
      <h2 className="mb-3 pr-12 text-2xl">{title}</h2>
      <ExerciseBrowser
        rows={rows}
        categories={categories}
        initialFilters={initial}
        reservedHeight={430}
        onSelect={(r) => {
          onPick(r);
          onClose();
        }}
      />
    </ExerciseSheet>
  );
}
