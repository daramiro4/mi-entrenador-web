"use client";

import { Search, X } from "lucide-react";
import type { Facets, Filters } from "@/lib/exercises/search";
import { EMPTY_FILTERS, hasActiveFilters } from "@/lib/exercises/search";
import { equipmentLabel, muscleLabel } from "@/lib/exercises/labels";
import { Button } from "@/components/ui/Button";

const SELECT = "min-h-11 w-full rounded-[12px] border border-separator bg-surface-2 px-3 text-base text-label";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex min-w-[150px] flex-1 flex-col gap-1">
      <span className="text-xs text-label-2">{label}</span>
      {children}
    </label>
  );
}

function Toggle({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`inline-flex min-h-11 items-center rounded-full border px-4 text-sm ${pressed ? "border-label bg-surface-2 text-label" : "border-separator text-label-2 hover:text-label"}`}
    >
      {children}
    </button>
  );
}

/** Búsqueda ES/EN y filtros (categoría, músculo, material, nivel, con animación). En móvil los filtros se pliegan. */
export function ExerciseFilters({
  filters,
  onChange,
  facets,
  categoryNames,
  total,
  shown,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  facets: Facets;
  categoryNames: Record<string, string>;
  total: number;
  shown: number;
}) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });
  const active = hasActiveFilters(filters);

  const panel = (
    <div className="mt-3 flex flex-wrap items-end gap-3">
      <Field label="Categoría">
        <select className={SELECT} value={filters.category ?? ""} onChange={(e) => set({ category: e.target.value || null })}>
          <option value="">Todas</option>
          {facets.categories.map((c) => (
            <option key={c.value} value={c.value}>{categoryNames[c.value] ?? c.value} ({c.count})</option>
          ))}
        </select>
      </Field>
      <Field label="Músculo">
        <select className={SELECT} value={filters.muscle ?? ""} onChange={(e) => set({ muscle: e.target.value || null })}>
          <option value="">Todos</option>
          {facets.muscles.map((m) => (
            <option key={m.value} value={m.value}>{muscleLabel(m.value)} ({m.count})</option>
          ))}
        </select>
      </Field>
      <Field label="Material">
        <select className={SELECT} value={filters.equipment ?? ""} onChange={(e) => set({ equipment: e.target.value || null })}>
          <option value="">Todo</option>
          {facets.equipment.map((q) => (
            <option key={q.value} value={q.value}>{equipmentLabel(q.value)} ({q.count})</option>
          ))}
        </select>
      </Field>
      <div role="group" aria-label="Nivel" className="flex flex-col gap-1">
        <span className="text-xs text-label-2">Nivel</span>
        <div className="inline-flex rounded-full bg-fill p-1">
          {([null, ...facets.levels.map((l) => l.value)] as (1 | 2 | 3 | null)[]).map((l) => (
            <button
              key={l ?? "all"}
              type="button"
              aria-pressed={filters.level === l}
              onClick={() => set({ level: l })}
              className={`min-h-11 min-w-11 rounded-full px-3 font-mono text-sm ${filters.level === l ? "bg-surface-2 text-label" : "text-label-2 hover:text-label"}`}
            >
              {l ?? "Todos"}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Toggle pressed={filters.withAnimation} onClick={() => set({ withAnimation: !filters.withAnimation })}>Con animación</Toggle>
        <Toggle pressed={filters.onlyReviewed} onClick={() => set({ onlyReviewed: !filters.onlyReviewed })}>Solo revisados</Toggle>
      </div>
    </div>
  );

  return (
    <div>
      <div className="relative">
        <Search size={18} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-label-2" />
        <input
          type="search"
          value={filters.query}
          onChange={(e) => set({ query: e.target.value })}
          placeholder="Buscar en español o en inglés (p. ej. «sentadilla», «row»)"
          aria-label="Buscar ejercicio"
          className="min-h-12 w-full rounded-full border border-separator bg-surface pl-11 pr-12 text-base text-label placeholder:text-label-2/70 focus:border-label focus:outline-none"
        />
        {filters.query && (
          <button type="button" onClick={() => set({ query: "" })} aria-label="Borrar la búsqueda" className="absolute right-1 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-label-2 hover:text-label">
            <X size={18} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Escritorio: filtros siempre visibles. Móvil: plegados. */}
      <div className="hidden sm:block">{panel}</div>
      <details className="mt-3 sm:hidden">
        <summary className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-separator px-4 text-sm">Filtros{active ? " · activos" : ""}</summary>
        {panel}
      </details>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-sm text-label-2" role="status" aria-live="polite">
          {shown === total ? `${total} ejercicios` : `${shown} de ${total} ejercicios`}
        </p>
        {active && (
          <Button type="button" variant="ghost" onClick={() => onChange(EMPTY_FILTERS)}>Limpiar filtros</Button>
        )}
      </div>
    </div>
  );
}
