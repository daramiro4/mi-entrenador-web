import type { ExerciseListRow } from "./ui-types";

/** Minúsculas sin acentos ni signos: "Sentadilla" = "sentadilla" = "SENTADILLA". */
export function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export interface Filters {
  query: string;
  category: string | null;
  muscle: string | null;
  equipment: string | null;
  level: 1 | 2 | 3 | null;
  withAnimation: boolean;
  /** Solo fichas revisadas (excluye borradores). */
  onlyReviewed: boolean;
}

export const EMPTY_FILTERS: Filters = { query: "", category: null, muscle: null, equipment: null, level: null, withAnimation: false, onlyReviewed: false };

export const hasActiveFilters = (f: Filters): boolean =>
  f.query.trim() !== "" || f.category !== null || f.muscle !== null || f.equipment !== null || f.level !== null || f.withAnimation || f.onlyReviewed;

export interface IndexedRow {
  row: ExerciseListRow;
  /** Texto buscable ya normalizado: nombre ES, nombre EN, clave de Garmin y categoría. */
  haystack: string;
  es: string;
  en: string;
}

/** Prepara las filas una sola vez (la normalización es lo caro; filtrar después es barato). */
export function buildIndex(rows: ExerciseListRow[], categoryNames: Record<string, string> = {}): IndexedRow[] {
  return rows.map((row) => {
    const es = normalize(row.name_es);
    const en = normalize(row.name_en);
    return { row, es, en, haystack: [es, en, normalize(row.garmin_name), normalize(categoryNames[row.garmin_category] ?? row.garmin_category)].join(" ") };
  });
}

/**
 * Relevancia de una consulta (0 = no coincide). Todas las palabras de la consulta deben aparecer.
 * Más puntos: nombre exacto > empieza por la consulta > palabra que empieza por ella > contiene; el español pesa más que el inglés.
 */
export function relevance(item: IndexedRow, query: string): number {
  const q = normalize(query);
  if (q === "") return 1;
  const words = q.split(" ");
  if (!words.every((w) => item.haystack.includes(w))) return 0;
  let score = 1;
  for (const [text, weight] of [[item.es, 3], [item.en, 2]] as const) {
    if (text === q) score = Math.max(score, 100 * weight);
    else if (text.startsWith(q)) score = Math.max(score, 60 * weight);
    else if (words.every((w) => text.split(" ").some((tw) => tw.startsWith(w)))) score = Math.max(score, 30 * weight);
    else if (text.includes(q)) score = Math.max(score, 12 * weight);
  }
  return score;
}

export function matchesFilters(row: ExerciseListRow, f: Filters, hasAnimation: (row: ExerciseListRow) => boolean): boolean {
  if (f.category && row.garmin_category !== f.category) return false;
  if (f.muscle && !row.primary_muscles.includes(f.muscle)) return false;
  if (f.equipment && !row.equipment.includes(f.equipment)) return false;
  if (f.level !== null && row.level !== f.level) return false;
  if (f.onlyReviewed && row.review_status !== "reviewed") return false;
  if (f.withAnimation && !hasAnimation(row)) return false;
  return true;
}

/** Filtra y ordena: por relevancia si hay consulta; si no, fichas con contenido primero y luego por nombre. */
export function searchExercises(index: IndexedRow[], f: Filters, hasAnimation: (row: ExerciseListRow) => boolean): ExerciseListRow[] {
  const q = f.query.trim();
  const scored: { row: ExerciseListRow; score: number }[] = [];
  for (const item of index) {
    if (!matchesFilters(item.row, f, hasAnimation)) continue;
    const score = relevance(item, q);
    if (score > 0) scored.push({ row: item.row, score });
  }
  const content = (r: ExerciseListRow) => (r.review_status === "reviewed" ? 2 : r.level !== null ? 1 : 0);
  scored.sort((a, b) => b.score - a.score || content(b.row) - content(a.row) || a.row.name_es.localeCompare(b.row.name_es, "es"));
  return scored.map((s) => s.row);
}

export interface Facets {
  categories: { value: string; count: number }[];
  muscles: { value: string; count: number }[];
  equipment: { value: string; count: number }[];
  levels: { value: 1 | 2 | 3; count: number }[];
}

/** Opciones de cada filtro con su recuento (sobre TODAS las filas, para que el desplegable no cambie al filtrar). */
export function buildFacets(rows: ExerciseListRow[]): Facets {
  const count = (values: string[]) => {
    const m = new Map<string, number>();
    for (const v of values) m.set(v, (m.get(v) ?? 0) + 1);
    return [...m.entries()].map(([value, c]) => ({ value, count: c })).sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
  };
  const levels = new Map<1 | 2 | 3, number>();
  for (const r of rows) if (r.level) levels.set(r.level, (levels.get(r.level) ?? 0) + 1);
  return {
    categories: count(rows.map((r) => r.garmin_category)),
    muscles: count(rows.flatMap((r) => r.primary_muscles)),
    equipment: count(rows.flatMap((r) => r.equipment)),
    levels: ([1, 2, 3] as const).filter((l) => levels.has(l)).map((value) => ({ value, count: levels.get(value)! })),
  };
}
