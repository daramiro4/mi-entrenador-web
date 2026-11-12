import { CATEGORY_ES, translateName } from "./names-es";

/**
 * Constructor PURO del catálogo de ejercicios (sin red ni disco): fuentes importadas por
 * scripts/import-garmin-exercises.ts + las fichas curadas del módulo de fuerza → catálogo + CSV de nombres + migración SQL.
 * Se regenera con `npm run gen:exercise-catalog`; ver docs/exercise-library.md.
 */

export type ReviewStatus = "draft" | "reviewed";
/** curated = ficha del módulo de fuerza · reviewed = revisado por el responsable · proposed = traducción propuesta (pendiente de revisar) · auto = diccionario · en = inglés. */
export type NameStatus = "curated" | "reviewed" | "proposed" | "auto" | "en";
export type Dose = { type: "time"; seconds: number } | { type: "reps"; reps: number };
/** De dónde salen los músculos: Exercises.json de Garmin, una ficha curada o una corrección manual. */
export type MusclesSource = "exercises_json" | "curated" | "manual";

/** Categorías que NUNCA entran en el plan (plan_eligible=false) salvo decisión explícita en data/exercise-overrides.json. */
export const PLAN_BLOCKED_CATEGORIES = ["OLYMPIC_LIFT", "PLYO"] as const;

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
  /** null si no hay músculos conocidos. Permite sustituir estos datos antes de abrir la app a más usuarios. */
  muscles_source: MusclesSource | null;
  movement_pattern: string | null;
  /** Arquetipo de animación previsto (ver lib/exercises/rig/archetypes). Puede ser uno aún sin rig ("pending"). */
  archetype: string | null;
  level: 1 | 2 | 3 | null;
  dose_default: Dose | null;
  cues: string[];
  common_mistake: string | null;
  /** Alternativas como clave completa "CATEGORÍA/EJERCICIO" (el nombre de Garmin solo NO es único: hay 27 repetidos entre categorías). */
  alternatives: string[];
  review_status: ReviewStatus;
  /** true SOLO si review_status='reviewed' (y no es olímpico/pliométrico salvo decisión explícita): lo que el motor de plan puede proponer. */
  plan_eligible: boolean;
  /** false si la clave es más nueva que el FIT SDK 21.221 (Garmin Connect la acepta; el SDK aún no la lista). */
  fit_sdk_known: boolean;
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

/**
 * Corrección manual de un ejercicio (data/exercise-overrides.json). Se aplica SIEMPRE encima de lo importado y de las fichas
 * curadas, así que regenerar nunca pisa una corrección. Clave: "CATEGORÍA/EJERCICIO". Solo estos campos:
 */
export interface ExerciseOverride {
  name_es?: string;
  equipment?: string[];
  primary_muscles?: string[];
  secondary_muscles?: string[];
  movement_pattern?: string | null;
  archetype?: string | null;
  level?: 1 | 2 | 3 | null;
  dose_default?: Dose | null;
  cues?: string[];
  common_mistake?: string | null;
  alternatives?: string[];
  review_status?: ReviewStatus;
  plan_eligible?: boolean;
}
export const OVERRIDE_FIELDS: (keyof ExerciseOverride)[] = [
  "name_es", "equipment", "primary_muscles", "secondary_muscles", "movement_pattern", "archetype", "level", "dose_default",
  "cues", "common_mistake", "alternatives", "review_status", "plan_eligible",
];

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
  ["PULL_UP", "pull_up_bar"],
  ["CHIN_UP", "pull_up_bar"],
  ["BODY_WEIGHT", "bodyweight"],
  ["BODYWEIGHT", "bodyweight"],
];

/** Categorías de peso corporal inequívocas (movilidad / calentamiento). El resto, sin pista en el nombre, es 'unknown'. */
const UNEQUIVOCAL_BODYWEIGHT_CATEGORIES = new Set(["WARM_UP"]);

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
};

/** Equipo que el nombre indica EXPLÍCITAMENTE (palabras de la clave + categorías de material propio). Puede ser vacío. */
export function explicitEquipment(category: string, garminName: string): string[] {
  const words = ` ${garminName.replace(/^_+/, "")} `;
  const found = new Set<string>();
  for (const [word, equipment] of EQUIPMENT_WORDS) {
    // Palabra completa dentro de la clave (separada por _).
    if (words.includes(`_${word}_`) || words.startsWith(` ${word}_`) || words.endsWith(`_${word} `) || words === ` ${word} `) found.add(equipment);
  }
  const byCategory = EQUIPMENT_BY_CATEGORY[category];
  if (byCategory) found.add(byCategory);
  // Con banda de asistencia no se pide barra aparte en el nombre.
  if (found.has("band") && found.has("pull_up_bar")) found.delete("pull_up_bar");
  return [...found].sort();
}

/**
 * Equipo conservador: lo que indica el nombre; si no hay ninguna pista, 'unknown'. 'bodyweight' solo con BODY_WEIGHT en
 * la clave, en categorías inequívocas (calentamiento) o por ficha curada. Nunca se asume peso corporal por defecto.
 */
export function deriveEquipment(category: string, garminName: string): string[] {
  const found = explicitEquipment(category, garminName);
  if (found.length > 0) return found;
  return UNEQUIVOCAL_BODYWEIGHT_CATEGORIES.has(category) ? ["bodyweight"] : ["unknown"];
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
  /** Correcciones manuales (data/exercise-overrides.json), aplicadas al final. */
  overrides?: Record<string, ExerciseOverride>;
  /** Claves "CATEGORÍA/EJERCICIO" que el FIT SDK 21.221 aún no lista (fit_sdk_known=false). */
  fitUnknown?: Set<string>;
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
    muscles_source: null,
    movement_pattern: PATTERN_BY_CATEGORY[category] ?? null,
    archetype: null,
    level: null,
    dose_default: null,
    cues: [],
    common_mistake: null,
    alternatives: [],
    review_status: "draft",
    plan_eligible: false,
    fit_sdk_known: true,
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
      if (ex.primary_muscles.length > 0 || ex.secondary_muscles.length > 0) ex.muscles_source = "exercises_json";
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
  }

  // 5) Fichas curadas del módulo de fuerza: se migran SIN perder nada y quedan 'reviewed'.
  const slugToGarmin = new Map(input.legacy.map((l) => [l.slug, `${l.garmin_category}/${l.garmin_exercise}`]));
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

  // 6) Correcciones manuales: encima de todo lo anterior. Un override a un ejercicio inexistente es un error (evita typos silenciosos).
  for (const [id, ov] of Object.entries(input.overrides ?? {})) {
    const [category, ...rest] = id.split("/");
    const ex = byKey.get(pairKey(category, rest.join("/")));
    if (!ex) throw new Error(`Override para un ejercicio que no existe: ${id}`);
    for (const field of Object.keys(ov)) {
      if (!OVERRIDE_FIELDS.includes(field as keyof ExerciseOverride)) throw new Error(`Override ${id}: campo no permitido "${field}"`);
    }
    // Un override de nombre es una PROPUESTA hasta que el responsable la marque "reviewed" en el CSV.
    if (ov.name_es !== undefined) { ex.name_es = ov.name_es; ex.name_es_status = "proposed"; }
    if (ov.equipment !== undefined) ex.equipment = [...ov.equipment].sort();
    if (ov.primary_muscles !== undefined || ov.secondary_muscles !== undefined) {
      if (ov.primary_muscles !== undefined) ex.primary_muscles = [...ov.primary_muscles];
      if (ov.secondary_muscles !== undefined) ex.secondary_muscles = [...ov.secondary_muscles];
      ex.muscles_source = ex.primary_muscles.length + ex.secondary_muscles.length > 0 ? "manual" : null;
    }
    if (ov.movement_pattern !== undefined) ex.movement_pattern = ov.movement_pattern;
    if (ov.archetype !== undefined) ex.archetype = ov.archetype;
    if (ov.level !== undefined) ex.level = ov.level;
    if (ov.dose_default !== undefined) ex.dose_default = ov.dose_default;
    if (ov.cues !== undefined) ex.cues = [...ov.cues];
    if (ov.common_mistake !== undefined) ex.common_mistake = ov.common_mistake;
    if (ov.alternatives !== undefined) {
      for (const alt of ov.alternatives) {
        const [altCategory, ...altRest] = alt.split("/");
        if (!byKey.has(pairKey(altCategory, altRest.join("/")))) throw new Error(`Override ${id}: la alternativa "${alt}" no existe en el catálogo (usa la clave completa CATEGORÍA/EJERCICIO)`);
      }
      ex.alternatives = [...ov.alternatives];
    }
    if (ov.review_status !== undefined) ex.review_status = ov.review_status;
    if (ov.plan_eligible === true && ex.review_status !== "reviewed") throw new Error(`Override ${id}: plan_eligible=true exige review_status='reviewed'`);
  }

  // 6b) Nombres revisados por el responsable (data/exercise-names-es.csv, estado "reviewed"): mandan sobre todo lo demás, incluidas mis propuestas.
  for (const ex of byKey.values()) {
    const reviewed = input.reviewedNames?.get(pairKey(ex.garmin_category, ex.garmin_name));
    if (reviewed) {
      ex.name_es = reviewed;
      ex.name_es_status = "reviewed";
    }
  }

  // 7) plan_eligible: solo fichas revisadas con nivel, y nunca olímpicos/pliométricos salvo override explícito (true).
  for (const ex of byKey.values()) {
    const ov = input.overrides?.[`${ex.garmin_category}/${ex.garmin_name}`];
    const blocked = (PLAN_BLOCKED_CATEGORIES as readonly string[]).includes(ex.garmin_category);
    const base = ex.review_status === "reviewed" && ex.level !== null && !blocked;
    ex.plan_eligible = ov?.plan_eligible !== undefined ? ov.plan_eligible && ex.review_status === "reviewed" : base;
    ex.fit_sdk_known = !(input.fitUnknown?.has(`${ex.garmin_category}/${ex.garmin_name}`) ?? false);
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
/** Script de vuelta. Vive FUERA de supabase/migrations a propósito: no debe ejecutarse solo con `db push`. */
export const ROLLBACK_FILE = "supabase/rollbacks/20261112120000_exercise_catalog.down.sql";

/** Vuelta de la migración: elimina las tablas nuevas y devuelve `exercises_legacy` a su nombre (y sus índices/política). */
export function buildRollbackSql(): string {
  return `-- VUELTA de supabase/migrations/20261112120000_exercise_catalog.sql. GENERADO (npm run gen:exercise-catalog).
-- NO está en supabase/migrations a propósito: se ejecuta a mano (psql / SQL editor) solo si hay que deshacer el corte.
--
-- Hace: elimina exercises (la NUEVA), exercise_animations y exercise_categories, y devuelve exercises_legacy a su nombre original
-- con su clave primaria, su unique de slug y su política de lectura. Las 41 filas y las poses de la tabla antigua no se tocan.
-- ADVERTENCIA: se pierde todo lo que se haya escrito en las tablas nuevas (ediciones de fichas, animaciones, revisiones).
--           Haz antes un pg_dump de exercises / exercise_animations si hay trabajo que conservar.
-- Se detiene sin cambios si el estado no es el esperado (las comprobaciones van dentro de la misma transacción).

begin;

do $$
begin
  if to_regclass('public.exercises_legacy') is null then
    raise exception 'No existe public.exercises_legacy: la migración no está aplicada (o ya se deshizo).';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'exercises' and column_name = 'garmin_category') then
    raise exception 'public.exercises no es la tabla nueva (no tiene garmin_category): no se hace nada.';
  end if;
end $$;

drop table public.exercises;
drop table public.exercise_animations;
drop table public.exercise_categories;

alter table public.exercises_legacy rename to exercises;
alter index public.exercises_legacy_pkey rename to exercises_pkey;
alter index public.exercises_legacy_slug_key rename to exercises_slug_key;
alter policy exercises_legacy_read_authenticated on public.exercises rename to exercises_read_authenticated;

commit;
`;
}

export function buildMigrationSql(catalog: Catalog): string {
  const out: string[] = [];
  out.push(`-- Catálogo de ejercicios de Garmin (≈${catalog.meta.counts.exercises} ejercicios, ${catalog.meta.counts.categories} categorías) con ficha animable.
-- GENERADO por \`npm run gen:exercise-catalog\` desde data/garmin-exercises.json. No editar a mano.
--
-- Sustituye a la tabla \`exercises\` del módulo de fuerza SIN perder datos: la antigua pasa a \`exercises_legacy\`
-- (con sus poses pose_a/pose_b y sus 41 filas) y NO se borra aquí; se elimina en una migración posterior cuando el
-- módulo de fuerza esté verificado sobre el catálogo nuevo. Las 41 fichas curadas están migradas a la tabla nueva
-- con review_status = 'reviewed' y su slug en legacy_slug.
-- VUELTA (antes de borrar exercises_legacy): supabase/rollbacks/20261112120000_exercise_catalog.down.sql
-- (fuera de supabase/migrations a propósito; probada ida y vuelta con scripts/test-exercise-migration.sh).

begin;

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
  name_es_status text not null default 'en' check (name_es_status = any (array['curated','reviewed','proposed','auto','en'])),
  equipment text[] not null default '{}',
  primary_muscles text[] not null default '{}',
  secondary_muscles text[] not null default '{}',
  muscles_source text check (muscles_source is null or muscles_source = any (array['exercises_json','curated','manual'])),
  movement_pattern text,
  archetype text,
  level smallint check (level between 1 and 3),
  dose_default jsonb,
  cues jsonb not null default '[]'::jsonb,
  common_mistake text,
  alternatives text[] not null default '{}',
  animation_id uuid references public.exercise_animations(id),
  review_status text not null default 'draft' check (review_status = any (array['draft','reviewed'])),
  plan_eligible boolean not null default false,
  fit_sdk_known boolean not null default true,
  source text not null,
  legacy_slug text unique,
  leg_load text check (leg_load = any (array['none','light','heavy'])),
  contraindications text[] not null default '{}',
  unilateral boolean not null default false,
  constraint exercises_garmin_key unique (garmin_category, garmin_name),
  constraint exercises_plan_eligible_reviewed check (not plan_eligible or review_status = 'reviewed')
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

-- Permisos: solo lectura para usuarios con sesión; el rol anónimo no ve nada (mismo criterio que supabase/migrations/20261110003825_security_hardening.sql).
-- Los privilegios por defecto de Supabase darían escritura a las tablas nuevas; RLS ya la bloquea, pero se quitan para no depender de una sola barrera.
revoke all on public.exercise_categories, public.exercise_animations, public.exercises from anon;
revoke insert, update, delete, truncate, trigger, references on public.exercise_categories, public.exercise_animations, public.exercises from authenticated;
`);

  out.push("insert into public.exercise_categories (garmin_category, name_es, name_en) values");
  out.push(catalog.categories.map((c) => `  (${q(c.garmin_category)}, ${q(c.name_es)}, ${q(c.name_en)})`).join(",\n") + ";\n");

  const cols = "garmin_category, garmin_name, name_en, name_es, name_es_status, equipment, primary_muscles, secondary_muscles, muscles_source, movement_pattern, archetype, level, dose_default, cues, common_mistake, alternatives, review_status, plan_eligible, fit_sdk_known, source, legacy_slug, leg_load, contraindications, unilateral";
  const rowSql = (e: CatalogExercise) =>
    `  (${[
      q(e.garmin_category), q(e.garmin_name), q(e.name_en), q(e.name_es), q(e.name_es_status),
      arr(e.equipment), arr(e.primary_muscles), arr(e.secondary_muscles), nul(e.muscles_source),
      nul(e.movement_pattern), nul(e.archetype), nul(e.level), e.dose_default ? jsonb(e.dose_default) : "null", jsonb(e.cues),
      nul(e.common_mistake), arr(e.alternatives), q(e.review_status), String(e.plan_eligible), String(e.fit_sdk_known), q(e.source),
      nul(e.legacy_slug), nul(e.leg_load), arr(e.contraindications), String(e.unilateral),
    ].join(", ")})`;
  for (let i = 0; i < catalog.exercises.length; i += 250) {
    out.push(`insert into public.exercises (${cols}) values`);
    out.push(catalog.exercises.slice(i, i + 250).map(rowSql).join(",\n") + ";\n");
  }
  out.push("commit;\n");
  return out.join("\n");
}
