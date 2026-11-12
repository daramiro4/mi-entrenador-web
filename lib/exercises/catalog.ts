import { CATEGORY_ES, translateName } from "./names-es";

/**
 * Constructor PURO del catálogo de ejercicios (sin red ni disco): fuentes importadas por
 * scripts/import-garmin-exercises.ts + las fichas curadas del módulo de fuerza → catálogo + CSV de nombres + migración SQL.
 * Se regenera con `npm run gen:exercise-catalog`; ver docs/exercise-library.md.
 */

export type ReviewStatus = "draft" | "reviewed";
export type NameStatus = "curated" | "reviewed" | "auto" | "en";
export type Dose = { type: "time"; seconds: number } | { type: "reps"; reps: number };

export interface CatalogCategory {
  garmin_category: string;
  name_en: string;
  name_es: string;
  exercise_count: number;
}

export interface CatalogExercise {
  garmin_category: string;
  garmin_name: string;
  name_en: string;
  name_es: string;
  name_es_status: NameStatus;
  equipment: string[];
  primary_muscles: string[];
  secondary_muscles: string[];
  movement_pattern: string | null;
  level: 1 | 2 | 3 | null;
  dose_default: Dose | null;
  cues: string[];
  common_mistake: string | null;
  /** garmin_name de ejercicios alternativos (misma categoría o no). */
  alternatives: string[];
  review_status: ReviewStatus;
  source: string;
  /** Slug del módulo de fuerza actual (lib/strength/library.ts), si viene de ahí. */
  legacy_slug: string | null;
  leg_load: "none" | "light" | "heavy" | null;
  contraindications: string[];
  unilateral: boolean;
}

export interface Catalog {
  meta: { sources: string[]; counts: { categories: number; exercises: number }; notes: string[] };
  categories: CatalogCategory[];
  exercises: CatalogExercise[];
}

export interface RawRow {
  name: string;
  category: string;
  exercise: string;
}
export interface MuscleMap {
  [category: string]: { [exercise: string]: { p: string[]; s: string[] } };
}

/** Ficha curada del módulo de fuerza (lib/strength/library.ts), ya con los emparejamientos de Garmin corregidos. */
export interface LegacyExercise {
  slug: string;
  name_es: string;
  pattern: string;
  equipment: string[];
  level: 1 | 2 | 3;
  leg_load: "none" | "light" | "heavy";
  contraindications: string[];
  alternatives: string[];
  cues_es: string[];
  common_error_es: string;
  garmin_category: string;
  garmin_exercise: string;
  unilateral: boolean;
  mode: "reps" | "time";
}

/* ------------------------------------------------------------------ Metadatos derivados */

export const MUSCLE_ES: Record<string, string> = {
  ABDUCTORS: "Abductores",
  ABS: "Abdominales",
  ADDUCTORS: "Aductores",
  BICEPS: "Bíceps",
  CALVES: "Gemelos",
  CHEST: "Pecho",
  FOREARM: "Antebrazo",
  GLUTES: "Glúteos",
  HAMSTRINGS: "Isquiotibiales",
  HIPS: "Cadera",
  LATS: "Dorsales",
  LOWER_BACK: "Lumbar",
  OBLIQUES: "Oblicuos",
  QUADS: "Cuádriceps",
  SHOULDERS: "Hombros",
  TRAPS: "Trapecios",
  TRICEPS: "Tríceps",
};

/** Equipo por palabras del nombre (la clave de Garmin, con _ como separador). Orden estable; admite varios. */
const EQUIPMENT_WORDS: [string, string][] = [
  ["BARBELL", "barbell"],
  ["EZ_BAR", "barbell"],
  ["LANDMINE", "barbell"],
  ["DUMBBELL", "dumbbell"],
  ["DUMBBELLS", "dumbbell"],
  ["KETTLEBELL", "kettlebell"],
  ["BAND", "band"],
  ["BANDED", "band"],
  ["CABLE", "cable"],
  ["MACHINE", "machine"],
  ["SMITH", "machine"],
  ["SUSPENSION", "suspension"],
  ["TRX", "suspension"],
  ["RING", "rings"],
  ["RINGS", "rings"],
  ["MEDICINE_BALL", "medicine_ball"],
  ["SWISS_BALL", "stability_ball"],
  ["STABILITY_BALL", "stability_ball"],
  ["BOSU", "bosu"],
  ["FOAM_ROLL", "foam_roller"],
  ["BENCH", "bench"],
  ["BOX", "box"],
  ["PLATE", "plate"],
  ["SANDBAG", "sandbag"],
  ["SLED", "sled"],
  ["BATTLE_ROPE", "battle_rope"],
  ["TIRE", "tire"],
];

const EQUIPMENT_BY_CATEGORY: Record<string, string> = {
  BANDED_EXERCISES: "band",
  BATTLE_ROPE: "battle_rope",
  SANDBAG: "sandbag",
  SLED: "sled",
  SLEDGE_HAMMER: "sledgehammer",
  SUSPENSION: "suspension",
  TIRE: "tire",
  LADDER: "ladder",
  INDOOR_BIKE: "machine",
  ELLIPTICAL: "machine",
  STAIR_STEPPER: "machine",
  PULL_UP: "pull_up_bar",
};

export function deriveEquipment(category: string, garminName: string): string[] {
  const words = ` ${garminName.replace(/^_+/, "")} `;
  const found = new Set<string>();
  for (const [word, equipment] of EQUIPMENT_WORDS) {
    // Palabra completa dentro de la clave (separada por _).
    if (words.includes(`_${word}_`) || words.startsWith(` ${word}_`) || words.endsWith(`_${word} `) || words === ` ${word} `) found.add(equipment);
  }
  const byCategory = EQUIPMENT_BY_CATEGORY[category];
  if (byCategory && !(byCategory === "pull_up_bar" && found.has("band"))) found.add(byCategory);
  if (found.size === 0) found.add("bodyweight");
  return [...found].sort();
}

/** Patrón de movimiento por categoría. null cuando la categoría es heterogénea (no se inventa). */
const PATTERN_BY_CATEGORY: Record<string, string | null> = {
  SQUAT: "squat",
  LUNGE: "squat",
  DEADLIFT: "hinge",
  HIP_RAISE: "hinge",
  HYPEREXTENSION: "hinge",
  HIP_SWING: "hinge",
  BENCH_PRESS: "push",
  PUSH_UP: "push",
  SHOULDER_PRESS: "push",
  TRICEPS_EXTENSION: "push",
  FLYE: "push",
  LATERAL_RAISE: "push",
  ROW: "pull",
  PULL_UP: "pull",
  CURL: "pull",
  SHRUG: "pull",
  CORE: "core",
  CRUNCH: "core",
  SIT_UP: "core",
  PLANK: "core",
  LEG_RAISE: "core",
  CHOP: "core",
  CARRY: "carry",
  WARM_UP: "mobility",
};

/* ------------------------------------------------------------------ Construcción */

function humanize(key: string): string {
  return key
    .replace(/^_+/, "")
    .toLowerCase()
    .split("_")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function pairKey(category: string, name: string): string {
  return `${category}\u0000${name}`;
}

export interface BuildInput {
  rows: RawRow[];
  muscles: MuscleMap;
  legacy: LegacyExercise[];
  /** Nombres revisados a mano (data/exercise-names-es.csv con estado "reviewed"): mandan sobre el diccionario. */
  reviewedNames?: Map<string, string>;
  sources: string[];
}

export function buildCatalog(input: BuildInput): Catalog {
  const notes: string[] = [];
  const byKey = new Map<string, CatalogExercise>();

  const blank = (category: string, name: string, name_en: string, source: string): CatalogExercise => ({
    garmin_category: category,
    garmin_name: name,
    name_en,
    name_es: name_en,
    name_es_status: "en",
    equipment: deriveEquipment(category, name),
    primary_muscles: [],
    secondary_muscles: [],
    movement_pattern: PATTERN_BY_CATEGORY[category] ?? null,
    level: null,
    dose_default: null,
    cues: [],
    common_mistake: null,
    alternatives: [],
    review_status: "draft",
    source,
    legacy_slug: null,
    leg_load: null,
    contraindications: [],
    unilateral: false,
  });

  // 1) Filas de garminconnect (clave + nombre visible). Incluye las de clave == categoría (p. ej. SQUAT/SQUAT): son
  //    ejercicios reales del editor y ya las usa el módulo de fuerza.
  for (const r of input.rows) {
    if (r.exercise === "") throw new Error(`Fila sin clave de ejercicio: ${r.category} / ${r.name}`);
    byKey.set(pairKey(r.category, r.exercise), blank(r.category, r.exercise, r.name, "garminconnect"));
  }

  // 2) Ejercicios que solo conoce Exercises.json: se incluyen (son seleccionables en el editor) con el nombre derivado de la clave.
  let jsonOnly = 0;
  for (const [category, exercises] of Object.entries(input.muscles)) {
    for (const key of Object.keys(exercises)) {
      if (byKey.has(pairKey(category, key))) continue;
      byKey.set(pairKey(category, key), blank(category, key, humanize(key), "connect-json"));
      jsonOnly++;
    }
  }
  if (jsonOnly > 0) notes.push(`${jsonOnly} ejercicios solo en Exercises.json: name_en derivado de la clave (sin nombre visible oficial).`);

  // 3) Músculos.
  let withoutMuscles = 0;
  for (const ex of byKey.values()) {
    const m = input.muscles[ex.garmin_category]?.[ex.garmin_name];
    if (m) {
      ex.primary_muscles = m.p.filter(Boolean);
      ex.secondary_muscles = m.s.filter(Boolean);
      if (ex.source === "garminconnect") ex.source = "garminconnect+connect-json";
    }
    if (ex.primary_muscles.length === 0) withoutMuscles++;
  }
  if (withoutMuscles > 0) notes.push(`${withoutMuscles} ejercicios sin músculo primario conocido.`);

  // 4) Nombres en español: diccionario determinista → revisados a mano (CSV) → curados del módulo de fuerza.
  for (const ex of byKey.values()) {
    const t = translateName(ex.name_en);
    ex.name_es = t.name_es;
    ex.name_es_status = t.status;
    const reviewed = input.reviewedNames?.get(pairKey(ex.garmin_category, ex.garmin_name));
    if (reviewed) {
      ex.name_es = reviewed;
      ex.name_es_status = "reviewed";
    }
  }

  // 5) Fichas curadas del módulo de fuerza: se migran SIN perder nada y quedan 'reviewed'.
  const slugToGarmin = new Map(input.legacy.map((l) => [l.slug, l.garmin_exercise]));
  const used = new Set<string>();
  for (const l of input.legacy) {
    const key = pairKey(l.garmin_category, l.garmin_exercise);
    const ex = byKey.get(key);
    if (!ex) throw new Error(`La ficha "${l.slug}" apunta a ${l.garmin_category}/${l.garmin_exercise}, que no está en el catálogo.`);
    if (used.has(key)) throw new Error(`Dos fichas curadas apuntan al mismo ejercicio de Garmin: ${l.garmin_category}/${l.garmin_exercise}.`);
    used.add(key);
    ex.legacy_slug = l.slug;
    ex.name_es = l.name_es;
    ex.name_es_status = "curated";
    ex.equipment = [...l.equipment].sort();
    ex.movement_pattern = l.pattern;
    ex.level = l.level;
    ex.leg_load = l.leg_load;
    ex.contraindications = [...l.contraindications];
    ex.cues = [...l.cues_es];
    ex.common_mistake = l.common_error_es;
    ex.unilateral = l.unilateral;
    ex.dose_default = l.mode === "time" ? { type: "time", seconds: 40 } : { type: "reps", reps: 10 };
    ex.alternatives = l.alternatives.map((s) => {
      const target = slugToGarmin.get(s);
      if (!target) throw new Error(`La alternativa "${s}" de "${l.slug}" no existe en las fichas curadas.`);
      return target;
    });
    ex.review_status = "reviewed";
    ex.source = `${ex.source}+legacy-curated`;
  }

  const exercises = [...byKey.values()].sort((a, b) => a.garmin_category.localeCompare(b.garmin_category) || a.garmin_name.localeCompare(b.garmin_name));
  const counts = new Map<string, number>();
  for (const e of exercises) counts.set(e.garmin_category, (counts.get(e.garmin_category) ?? 0) + 1);
  const categories: CatalogCategory[] = [...counts.keys()].sort().map((c) => ({
    garmin_category: c,
    name_en: humanize(c),
    name_es: CATEGORY_ES[c] ?? humanize(c),
    exercise_count: counts.get(c)!,
  }));
  return { meta: { sources: input.sources, counts: { categories: categories.length, exercises: exercises.length }, notes }, categories, exercises };
}

/* ------------------------------------------------------------------ CSV de nombres (borrador revisable) */

const csvCell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

export function buildNamesCsv(catalog: Catalog): string {
  const lines = ["garmin_category,garmin_name,name_en,name_es,status"];
  for (const e of catalog.exercises) lines.push([e.garmin_category, e.garmin_name, e.name_en, e.name_es, e.name_es_status].map(csvCell).join(","));
  return lines.join("\n") + "\n";
}

/** Lee el CSV y devuelve SOLO las filas marcadas "reviewed" (las demás se recalculan). */
export function parseReviewedNames(csv: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const line of csv.split("\n").slice(1)) {
    if (!line.trim()) continue;
    const cells: string[] = [];
    let cur = "";
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (quoted) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') quoted = false; else cur += ch;
      } else if (ch === '"') quoted = true;
      else if (ch === ",") { cells.push(cur); cur = ""; } else cur += ch;
    }
    cells.push(cur);
    const [category, name, , nameEs, status] = cells;
    if (status === "reviewed" && category && name && nameEs) out.set(pairKey(category, name), nameEs);
  }
  return out;
}

/* ------------------------------------------------------------------ Migración SQL */

const q = (s: string) => `'${s.replace(/'/g, "''")}'`;
const arr = (a: string[]) => (a.length === 0 ? "'{}'::text[]" : `array[${a.map(q).join(", ")}]::text[]`);
const jsonb = (v: unknown) => `${q(JSON.stringify(v))}::jsonb`;
const nul = (v: string | number | null, fmt: (x: never) => string = ((x: string | number) => (typeof x === "number" ? String(x) : q(x))) as never) => (v === null ? "null" : fmt(v as never));

export const MIGRATION_FILE = "supabase/migrations/20261112120000_exercise_catalog.sql";

export function buildMigrationSql(catalog: Catalog): string {
  const out: string[] = [];
  out.push(`-- Catálogo de ejercicios de Garmin (≈${catalog.meta.counts.exercises} ejercicios, ${catalog.meta.counts.categories} categorías) con ficha animable.
-- GENERADO por \`npm run gen:exercise-catalog\` desde data/garmin-exercises.json. No editar a mano.
--
-- Sustituye a la tabla \`exercises\` del módulo de fuerza SIN perder datos: la antigua pasa a \`exercises_legacy\`
-- (con sus poses pose_a/pose_b y sus 41 filas) y NO se borra aquí; se elimina en una migración posterior cuando el
-- módulo de fuerza esté verificado sobre el catálogo nuevo. Las 41 fichas curadas están migradas a la tabla nueva
-- con review_status = 'reviewed' y su slug en legacy_slug.
-- Rollback manual (antes de borrar exercises_legacy):
--   drop table public.exercise_animations, public.exercises, public.exercise_categories cascade;
--   alter table public.exercises_legacy rename to exercises;  (y devolver los nombres de pkey/slug_key/política)

alter table public.exercises rename to exercises_legacy;
alter index public.exercises_pkey rename to exercises_legacy_pkey;
alter index public.exercises_slug_key rename to exercises_legacy_slug_key;
alter policy exercises_read_authenticated on public.exercises_legacy rename to exercises_legacy_read_authenticated;

create table public.exercise_categories (
  garmin_category text primary key,
  name_es text not null,
  name_en text not null
);

create table public.exercise_animations (
  id uuid primary key default gen_random_uuid(),
  archetype text not null,
  rig jsonb not null,
  loop_ms integer not null default 6000 check (loop_ms between 1000 and 20000),
  view text not null default 'side' check (view = any (array['side','front']))
);

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  garmin_category text not null references public.exercise_categories(garmin_category),
  garmin_name text not null,
  name_en text not null,
  name_es text not null,
  name_es_status text not null default 'en' check (name_es_status = any (array['curated','reviewed','auto','en'])),
  equipment text[] not null default '{}',
  primary_muscles text[] not null default '{}',
  secondary_muscles text[] not null default '{}',
  movement_pattern text,
  level smallint check (level between 1 and 3),
  dose_default jsonb,
  cues jsonb not null default '[]'::jsonb,
  common_mistake text,
  alternatives text[] not null default '{}',
  animation_id uuid references public.exercise_animations(id),
  review_status text not null default 'draft' check (review_status = any (array['draft','reviewed'])),
  source text not null,
  legacy_slug text unique,
  leg_load text check (leg_load = any (array['none','light','heavy'])),
  contraindications text[] not null default '{}',
  unilateral boolean not null default false,
  constraint exercises_garmin_key unique (garmin_category, garmin_name)
);

create index exercises_category_idx on public.exercises (garmin_category);
create index exercises_equipment_idx on public.exercises using gin (equipment);
create index exercises_primary_muscles_idx on public.exercises using gin (primary_muscles);

-- Lectura para usuarios con sesión; la escritura solo la hacen las migraciones / service_role (que se salta RLS).
alter table public.exercise_categories enable row level security;
alter table public.exercise_animations enable row level security;
alter table public.exercises enable row level security;
create policy exercise_categories_read_authenticated on public.exercise_categories for select to authenticated using (true);
create policy exercise_animations_read_authenticated on public.exercise_animations for select to authenticated using (true);
create policy exercises_read_authenticated on public.exercises for select to authenticated using (true);
`);

  out.push("insert into public.exercise_categories (garmin_category, name_es, name_en) values");
  out.push(catalog.categories.map((c) => `  (${q(c.garmin_category)}, ${q(c.name_es)}, ${q(c.name_en)})`).join(",\n") + ";\n");

  const cols = "garmin_category, garmin_name, name_en, name_es, name_es_status, equipment, primary_muscles, secondary_muscles, movement_pattern, level, dose_default, cues, common_mistake, alternatives, review_status, source, legacy_slug, leg_load, contraindications, unilateral";
  const rowSql = (e: CatalogExercise) =>
    `  (${[
      q(e.garmin_category), q(e.garmin_name), q(e.name_en), q(e.name_es), q(e.name_es_status),
      arr(e.equipment), arr(e.primary_muscles), arr(e.secondary_muscles),
      nul(e.movement_pattern), nul(e.level), e.dose_default ? jsonb(e.dose_default) : "null", jsonb(e.cues),
      nul(e.common_mistake), arr(e.alternatives), q(e.review_status), q(e.source),
      nul(e.legacy_slug), nul(e.leg_load), arr(e.contraindications), String(e.unilateral),
    ].join(", ")})`;
  for (let i = 0; i < catalog.exercises.length; i += 250) {
    out.push(`insert into public.exercises (${cols}) values`);
    out.push(catalog.exercises.slice(i, i + 250).map(rowSql).join(",\n") + ";\n");
  }
  return out.join("\n");
}
