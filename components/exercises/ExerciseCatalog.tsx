"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CategoryRow, ExerciseDetail, ExerciseListRow } from "@/lib/exercises/ui-types";
import { rowKey } from "@/lib/exercises/ui-types";
import { fetchExerciseDetail } from "@/lib/exercises/data";
import { createClient } from "@/lib/supabase/client";
import { ExerciseBrowser } from "./ExerciseBrowser";
import { ExerciseDetailView, type AlternativeLink } from "./ExerciseDetailView";
import { ExerciseSheet } from "./ExerciseSheet";

/**
 * /ejercicios: lista buscable de todo el catálogo y, al tocar un ejercicio, su ficha en una hoja lateral.
 * `details` (opcional) trae las fichas ya cargadas (páginas de ejemplo); sin él, se piden a la base de datos al abrirlas.
 */
export function ExerciseCatalog({
  rows,
  categories,
  details,
  initialOpenId = null,
}: {
  rows: ExerciseListRow[];
  categories: CategoryRow[];
  details?: Record<string, ExerciseDetail>;
  initialOpenId?: string | null;
}) {
  const [openId, setOpenId] = useState<string | null>(initialOpenId);
  const [fetched, setFetched] = useState<Record<string, ExerciseDetail | null>>({});
  const categoryNames = useMemo(() => Object.fromEntries(categories.map((c) => [c.garmin_category, c.name_es])), [categories]);
  const idByKey = useMemo(() => new Map(rows.map((r) => [rowKey(r), r.id])), [rows]);
  const nameByKey = useMemo(() => new Map(rows.map((r) => [rowKey(r), r.name_es])), [rows]);

  useEffect(() => {
    if (!openId || details || openId in fetched) return;
    let live = true;
    fetchExerciseDetail(createClient(), openId).then((res) => {
      if (live) setFetched((f) => ({ ...f, [openId]: res.ok ? res.data : null }));
    });
    return () => {
      live = false;
    };
  }, [openId, details, fetched]);

  const open = useCallback((id: string | null) => {
    setOpenId(id);
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("e", id);
    else url.searchParams.delete("e");
    window.history.replaceState(null, "", url.toString());
  }, []);

  const detail = openId ? (details ? details[openId] ?? null : fetched[openId] ?? null) : null;
  const loadingDetail = !!openId && !detail && (details ? false : !(openId in fetched));

  const alternatives: AlternativeLink[] = detail
    ? detail.alternatives.map((key) => ({
        key,
        name: nameByKey.get(key) ?? key,
        onOpen: idByKey.has(key) ? () => open(idByKey.get(key)!) : undefined,
      }))
    : [];

  return (
    <>
      <ExerciseBrowser rows={rows} categories={categories} onSelect={(r) => open(r.id)} activeId={openId} />
      <ExerciseSheet open={!!openId} onClose={() => open(null)} label="Ficha del ejercicio">
        {detail ? (
          <ExerciseDetailView key={detail.id} detail={detail} categoryName={categoryNames[detail.garmin_category] ?? detail.garmin_category} alternatives={alternatives} headingLevel={2} />
        ) : (
          <p className="py-10 text-center text-base text-label-2" role="status">
            {loadingDetail ? "Cargando ficha…" : "No se ha podido cargar la ficha de este ejercicio."}
          </p>
        )}
      </ExerciseSheet>
    </>
  );
}
