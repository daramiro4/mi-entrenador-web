import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { Dose } from "./catalog";
import type { CategoryRow, ExerciseDetail, ExerciseListRow } from "./ui-types";

/**
 * Acceso al catálogo (tablas exercise_categories / exercises, migración 20261112120000, aplicada en producción).
 * Las consultas van tipadas con lib/supabase/database.types.ts; cada fila se sigue convirtiendo a mano a los tipos de la UI
 * (arrays/jsonb/enums de texto) para no fiarse de más de lo que garantiza la base de datos.
 */
type TypedClient = SupabaseClient<Database>;
const LIST_COLUMNS = "id,garmin_category,garmin_name,name_es,name_en,equipment,primary_muscles,level,review_status,archetype";
const PAGE = 1000; // PostgREST limita a 1.000 filas por petición: se pagina

const arr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
const str = (v: unknown, fallback = ""): string => (typeof v === "string" ? v : fallback);
const level = (v: unknown): 1 | 2 | 3 | null => (v === 1 || v === 2 || v === 3 ? v : null);

export function toListRow(raw: Record<string, unknown>): ExerciseListRow {
  return {
    id: str(raw.id),
    garmin_category: str(raw.garmin_category),
    garmin_name: str(raw.garmin_name),
    name_es: str(raw.name_es),
    name_en: str(raw.name_en),
    equipment: arr(raw.equipment),
    primary_muscles: arr(raw.primary_muscles),
    level: level(raw.level),
    review_status: raw.review_status === "reviewed" ? "reviewed" : "draft",
    archetype: typeof raw.archetype === "string" ? raw.archetype : null,
  };
}

function toDose(v: unknown): Dose | null {
  if (!v || typeof v !== "object") return null;
  const d = v as { type?: unknown; seconds?: unknown; reps?: unknown };
  if (d.type === "time" && typeof d.seconds === "number") return { type: "time", seconds: d.seconds };
  if (d.type === "reps" && typeof d.reps === "number") return { type: "reps", reps: d.reps };
  return null;
}

export function toDetail(raw: Record<string, unknown>): ExerciseDetail {
  return {
    ...toListRow(raw),
    secondary_muscles: arr(raw.secondary_muscles),
    dose_default: toDose(raw.dose_default),
    cues: arr(raw.cues),
    common_mistake: typeof raw.common_mistake === "string" ? raw.common_mistake : null,
    alternatives: arr(raw.alternatives),
    name_es_status: str(raw.name_es_status, "en"),
    plan_eligible: raw.plan_eligible === true,
  };
}

export type CatalogResult<T> = { ok: true; data: T } | { ok: false; error: string };

export async function fetchCatalogList(db: TypedClient): Promise<CatalogResult<{ rows: ExerciseListRow[]; categories: CategoryRow[] }>> {
  const rows: ExerciseListRow[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db.from("exercises").select(LIST_COLUMNS).order("garmin_category").order("garmin_name").range(from, from + PAGE - 1);
    if (error) return { ok: false, error: error.message };
    for (const raw of data ?? []) rows.push(toListRow(raw));
    if (!data || data.length < PAGE) break;
  }
  if (rows.length > 0 && !rows[0].garmin_category) return { ok: false, error: "La tabla exercises no tiene el esquema nuevo (migración pendiente)." };
  const { data: cats, error: catError } = await db.from("exercise_categories").select("garmin_category,name_es,name_en").order("name_es");
  if (catError) return { ok: false, error: catError.message };
  return { ok: true, data: { rows, categories: (cats ?? []) satisfies CategoryRow[] } };
}

export async function fetchExerciseDetail(db: TypedClient, id: string): Promise<CatalogResult<ExerciseDetail | null>> {
  const { data, error } = await db.from("exercises").select("*").eq("id", id).maybeSingle();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ? toDetail(data) : null };
}
