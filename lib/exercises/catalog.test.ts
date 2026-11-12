import { describe, expect, it } from "vitest";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { EXERCISES } from "../strength/library";
import { GARMIN_OVERRIDES } from "../strength/garmin-overrides";
import {
  buildCatalog,
  buildMigrationSql,
  buildNamesCsv,
  buildRollbackSql,
  ROLLBACK_FILE,
  deriveEquipment,
  PLAN_BLOCKED_CATEGORIES,
  type ExerciseOverride,
  MIGRATION_FILE,
  parseReviewedNames,
  type Catalog,
  type LegacyExercise,
  type MuscleMap,
  type RawRow,
} from "./catalog";
import { CATEGORY_ES, translateName } from "./names-es";
import { buildContentReview, buildCuratedReview, INTENT_EN, sectionOf } from "./curated-review";
import { ARCHETYPES } from "./rig/archetypes";

const DATA = "data/garmin-exercises.json";
const NAMES = "data/exercise-names-es.csv";
const REVIEW_DOC = "docs/curated-mapping-review.md";
const CONTENT_DOC = "docs/exercise-content-review.md";

function load(): Catalog {
  const gc = JSON.parse(readFileSync("data/sources/garminconnect-exercises.json", "utf8")) as { source: string; rows: RawRow[] };
  const mu = JSON.parse(readFileSync("data/sources/connect-exercise-muscles.json", "utf8")) as { source: string; categories: MuscleMap };
  const legacy: LegacyExercise[] = EXERCISES.map((e) => {
    const [garmin_category, garmin_exercise] = GARMIN_OVERRIDES[e.slug] ?? [e.garmin_category, e.garmin_exercise];
    return {
      slug: e.slug, name_es: e.name_es, pattern: e.pattern, equipment: [...e.equipment], level: e.level, leg_load: e.leg_load,
      contraindications: [...e.contraindications], alternatives: [...e.alternatives], cues_es: [...e.cues_es],
      common_error_es: e.common_error_es, garmin_category, garmin_exercise, unilateral: e.unilateral, mode: e.mode,
    };
  });
  const reviewedNames = existsSync(NAMES) ? parseReviewedNames(readFileSync(NAMES, "utf8")) : undefined;
  const overrides = (JSON.parse(readFileSync("data/exercise-overrides.json", "utf8")) as { overrides: Record<string, ExerciseOverride> }).overrides;
  const fitUnknown = new Set((JSON.parse(readFileSync("data/sources/fit-sdk-unknown-keys.json", "utf8")) as { keys: string[] }).keys);
  return buildCatalog({ rows: gc.rows, muscles: mu.categories, legacy, reviewedNames, overrides, fitUnknown, sources: [gc.source, mu.source] });
}

describe("catálogo de ejercicios (generado)", () => {
  const catalog = load();

  it("los ficheros versionados coinciden con lo generado (UPDATE_CATALOG=1 / npm run gen:exercise-catalog para regenerar)", () => {
    const json = JSON.stringify(catalog, null, 1) + "\n";
    const csv = buildNamesCsv(catalog);
    const sql = buildMigrationSql(catalog);
    const review = buildCuratedReview(catalog);
    const down = buildRollbackSql();
    if (process.env.UPDATE_CATALOG === "1") {
      mkdirSync("supabase/rollbacks", { recursive: true });
      writeFileSync(ROLLBACK_FILE, down);
      writeFileSync(DATA, json);
      writeFileSync(NAMES, csv);
      writeFileSync(MIGRATION_FILE, sql);
      writeFileSync(REVIEW_DOC, review);
      writeFileSync(CONTENT_DOC, buildContentReview(catalog));
    }
    expect(readFileSync(DATA, "utf8")).toBe(json);
    expect(readFileSync(NAMES, "utf8")).toBe(csv);
    expect(readFileSync(MIGRATION_FILE, "utf8")).toBe(sql);
    expect(readFileSync(REVIEW_DOC, "utf8")).toBe(review);
    expect(readFileSync(ROLLBACK_FILE, "utf8")).toBe(down);
    expect(readFileSync(CONTENT_DOC, "utf8")).toBe(buildContentReview(catalog));
  });

  it("claves únicas y todas las categorías existen", () => {
    const keys = catalog.exercises.map((e) => `${e.garmin_category}/${e.garmin_name}`);
    expect(new Set(keys).size).toBe(keys.length);
    const cats = new Set(catalog.categories.map((c) => c.garmin_category));
    expect(catalog.exercises.every((e) => cats.has(e.garmin_category))).toBe(true);
    expect(catalog.categories.reduce((a, c) => a + c.exercise_count, 0)).toBe(catalog.exercises.length);
  });

  it("las 47 categorías del editor de Garmin tienen nombre en español curado", () => {
    expect(catalog.categories).toHaveLength(47);
    for (const c of catalog.categories) expect(CATEGORY_ES[c.garmin_category], c.garmin_category).toBeTruthy();
  });

  it("las fichas curadas del módulo de fuerza se migran enteras, como 'reviewed'", () => {
    const curated = catalog.exercises.filter((e) => e.legacy_slug);
    expect(curated).toHaveLength(EXERCISES.length);
    for (const l of EXERCISES) {
      const e = curated.find((x) => x.legacy_slug === l.slug)!;
      expect(e.review_status).toBe("reviewed");
      expect(e.name_es).toBe(l.name_es);
      expect(e.cues).toEqual(l.cues_es);
      expect(e.common_mistake).toBe(l.common_error_es);
      expect(e.level).toBe(l.level);
      expect(e.contraindications).toEqual(l.contraindications);
      expect(e.leg_load).toBe(l.leg_load);
      expect(e.alternatives).toHaveLength(l.alternatives.length);
      for (const a of e.alternatives) expect(a, `${l.slug} → ${a}`).toMatch(/^[A-Z0-9_]+\/[A-Z0-9_]+$/); // clave completa, no ambigua
    }
  });

  it("'Rotación torácica' conserva todo su contenido", () => {
    const e = catalog.exercises.find((x) => x.legacy_slug === "rotacion-toracica")!;
    expect(`${e.garmin_category}/${e.garmin_name}`).toBe("WARM_UP/THORACIC_ROTATION");
    expect(e.name_es).toBe("Rotación torácica");
    expect(e.cues).toEqual(["Cuatro apoyos, cadera quieta", "Mano tras la cabeza y abre el codo al techo", "Sigue el codo con la mirada"]);
    expect(e.common_mistake).toBe("Mover la cadera en vez de rotar el tronco.");
    expect(e.equipment).toEqual(["bodyweight"]);
    expect(e.unilateral).toBe(true);
    expect(e.dose_default).toEqual({ type: "time", seconds: 40 });
  });

  it("solo las fichas curadas son 'reviewed'; el resto es borrador, nunca elegible para el plan", () => {
    for (const e of catalog.exercises.filter((x) => !x.legacy_slug)) {
      expect(e.review_status).toBe("draft");
      expect(e.plan_eligible).toBe(false);
      expect(e.contraindications).toEqual([]);
    }
  });

  it("los ejercicios SIN contenido propuesto no llevan técnica inventada", () => {
    for (const e of catalog.exercises.filter((x) => !x.legacy_slug && x.cues.length === 0)) {
      expect(e.level).toBeNull();
      expect(e.common_mistake).toBeNull();
      expect(e.alternatives).toEqual([]);
    }
  });

  it("todo ejercicio tiene equipo y nombre", () => {
    for (const e of catalog.exercises) {
      expect(e.equipment.length, e.garmin_name).toBeGreaterThan(0);
      expect(e.name_en && e.name_es).toBeTruthy();
    }
  });

  const overrideKeys = new Set(Object.keys((JSON.parse(readFileSync("data/exercise-overrides.json", "utf8")) as { overrides: Record<string, unknown> }).overrides));

  it("equipo conservador: 'bodyweight' solo con BODY_WEIGHT en la clave, categoría de calentamiento o ficha curada; sin pista → 'unknown'", () => {
    for (const e of catalog.exercises) {
      if (!e.equipment.includes("bodyweight")) continue;
      // También si una corrección manual lo afirma explícitamente (data/exercise-overrides.json).
      const manual = overrideKeys.has(`${e.garmin_category}/${e.garmin_name}`);
      const ok = e.legacy_slug !== null || /BODY_?WEIGHT/.test(e.garmin_name) || e.garmin_category === "WARM_UP" || manual;
      expect(ok, `${e.garmin_category}/${e.garmin_name}`).toBe(true);
    }
    expect(catalog.exercises.some((e) => e.equipment.includes("unknown"))).toBe(true);
    expect(catalog.exercises.filter((e) => e.equipment.includes("unknown") && e.equipment.length > 1)).toEqual([]);
  });

  it("plan_eligible: solo fichas 'reviewed' con nivel, y ningún olímpico ni pliométrico", () => {
    const eligible = catalog.exercises.filter((e) => e.plan_eligible);
    expect(eligible.length).toBeGreaterThan(0);
    for (const e of eligible) {
      expect(e.review_status).toBe("reviewed");
      expect(e.level).not.toBeNull();
      expect((PLAN_BLOCKED_CATEGORIES as readonly string[]).includes(e.garmin_category)).toBe(false);
    }
    expect(catalog.exercises.filter((e) => e.review_status !== "reviewed" && e.plan_eligible)).toEqual([]);
  });

  it("muscles_source: 'exercises_json' cuando hay músculos de Exercises.json y null cuando no hay ninguno", () => {
    for (const e of catalog.exercises) {
      const has = e.primary_muscles.length + e.secondary_muscles.length > 0;
      expect(e.muscles_source === null, `${e.garmin_name}`).toBe(!has);
      if (has) expect(["exercises_json", "curated", "manual"]).toContain(e.muscles_source);
    }
  });

  it("fit_sdk_known=false exactamente en las claves que el FIT SDK no lista", () => {
    const unknown = (JSON.parse(readFileSync("data/sources/fit-sdk-unknown-keys.json", "utf8")) as { keys: string[] }).keys;
    const inCatalog = new Set(catalog.exercises.map((e) => `${e.garmin_category}/${e.garmin_name}`));
    const expected = unknown.filter((k) => inCatalog.has(k)).sort();
    const flagged = catalog.exercises.filter((e) => !e.fit_sdk_known).map((e) => `${e.garmin_category}/${e.garmin_name}`).sort();
    expect(flagged).toEqual(expected);
    expect(flagged.length).toBe(59);
  });

  it("el informe de emparejamiento cubre las fichas curadas, con 3 candidatas y avisos de material", () => {
    expect(Object.keys(INTENT_EN).sort()).toEqual(EXERCISES.map((e) => e.slug).sort());
    const doc = buildCuratedReview(catalog);
    expect((doc.match(/- \*\*Candidatas:\*\*/g) ?? []).length).toBe(EXERCISES.length);
    expect(doc).toContain("MATERIAL");
    expect(doc).toContain("BARBELL_HIP_THRUST_ON_FLOOR");
  });

  it("el SQL escapa comillas y usa los nombres de tabla esperados", () => {
    const sql = buildMigrationSql(catalog);
    expect(sql).toContain("alter table public.exercises rename to exercises_legacy;");
    expect(sql).toContain("create table public.exercises (");
    expect(sql).toContain("Child''s Pose Stretch");
  });
});

describe("derivación de equipo", () => {
  it("por palabras completas de la clave", () => {
    expect(deriveEquipment("SQUAT", "BARBELL_BACK_SQUAT")).toEqual(["barbell"]);
    expect(deriveEquipment("BENCH_PRESS", "DUMBBELL_BENCH_PRESS")).toEqual(["bench", "dumbbell"]);
    expect(deriveEquipment("CURL", "CABLE_BICEPS_CURL")).toEqual(["cable"]);
    expect(deriveEquipment("PLANK", "PLANK")).toEqual(["unknown"]);
    expect(deriveEquipment("SQUAT", "BODY_WEIGHT_WALL_SQUAT")).toEqual(["bodyweight"]);
    expect(deriveEquipment("WARM_UP", "STRETCH_CAT_COW")).toEqual(["bodyweight"]);
    expect(deriveEquipment("BANDED_EXERCISES", "SQUAT")).toEqual(["band"]);
    expect(deriveEquipment("PULL_UP", "PULL_UP")).toEqual(["pull_up_bar"]);
    expect(deriveEquipment("PULL_UP", "BANDED_PULL_UP")).toEqual(["band"]);
    // Una categoría con material heterogéneo no da pista: el jalón al pecho NO es una dominada en barra.
    expect(deriveEquipment("PULL_UP", "LAT_PULLDOWN")).toEqual(["unknown"]);
  });
  it("no confunde palabras que contienen otra (BANDED≠BAND dentro de otra palabra)", () => {
    expect(deriveEquipment("CORE", "HUSBANDRY")).toEqual(["unknown"]);
  });
});

describe("nombres en español", () => {
  it("traduce solo si todas las piezas son conocidas", () => {
    expect(translateName("Goblet Squat")).toEqual({ name_es: "Sentadilla goblet", status: "auto" });
    expect(translateName("Dumbbell Romanian Deadlift")).toEqual({ name_es: "Peso muerto rumano con mancuernas", status: "auto" });
    expect(translateName("Weighted Single-leg Calf Raise")).toEqual({ name_es: "Elevación de gemelos a una pierna con peso", status: "auto" });
  });
  it("si no hay certeza, deja el inglés (no inventa)", () => {
    expect(translateName("Ruck Flutter Kicks")).toEqual({ name_es: "Ruck Flutter Kicks", status: "en" });
    expect(translateName("Zottman Curl Wizard")).toEqual({ name_es: "Zottman Curl Wizard", status: "en" });
  });
  it("el CSV conserva las filas 'reviewed' y descarta el resto", () => {
    const csv = 'garmin_category,garmin_name,name_en,name_es,status\nSQUAT,GOBLET_SQUAT,Goblet Squat,"Sentadilla, goblet",reviewed\nSQUAT,SQUAT,Squat,Sentadilla,auto\n';
    const m = parseReviewedNames(csv);
    expect(m.size).toBe(1);
    expect([...m.values()]).toEqual(["Sentadilla, goblet"]);
  });
});

import { canonical, keysFromMigration, validateKeys } from "../../scripts/validate-garmin-keys";

describe("validador de claves (offline, contra las fuentes versionadas)", () => {
  const catalog = load();
  const gc = JSON.parse(readFileSync("data/sources/garminconnect-exercises.json", "utf8")) as { rows: RawRow[] };
  const mu = JSON.parse(readFileSync("data/sources/connect-exercise-muscles.json", "utf8")) as { categories: MuscleMap };
  const official = [
    ...gc.rows.map((r) => ({ garmin_category: r.category, garmin_name: r.exercise })),
    ...Object.entries(mu.categories).flatMap(([c, ex]) => Object.keys(ex).map((e) => ({ garmin_category: c, garmin_name: e }))),
  ];

  it("todas las claves del catálogo existen en las fuentes oficiales", () => {
    expect(validateKeys(catalog.exercises, official).errors).toEqual([]);
  });

  it("la migración inserta exactamente las filas del catálogo", () => {
    const fromSql = keysFromMigration(readFileSync(MIGRATION_FILE, "utf8"));
    expect(fromSql).toHaveLength(catalog.exercises.length);
    expect(validateKeys(fromSql, official).errors).toEqual([]);
  });

  it("detecta una clave inventada y una duplicada", () => {
    const report = validateKeys(
      [{ garmin_category: "SQUAT", garmin_name: "SENTADILLA_INVENTADA" }, { garmin_category: "SQUAT", garmin_name: "SQUAT" }, { garmin_category: "SQUAT", garmin_name: "SQUAT" }],
      official,
    );
    expect(report.errors.some((e) => e.includes("SENTADILLA_INVENTADA"))).toBe(true);
    expect(report.errors.some((e) => e.startsWith("duplicada"))).toBe(true);
  });

  it("la clave canónica ignora los guiones bajos (L_SIT = LSIT, _3_WAY = 3_WAY)", () => {
    expect(canonical("HANGING_L_SIT")).toBe(canonical("HANGING_LSIT"));
    expect(canonical("_3_WAY_CALF_RAISE")).toBe(canonical("3_WAY_CALF_RAISE"));
  });
});

describe("overrides manuales", () => {
  const rows: RawRow[] = [
    { name: "Thoracic Rotation", category: "WARM_UP", exercise: "THORACIC_ROTATION" },
    { name: "Goblet Squat", category: "SQUAT", exercise: "GOBLET_SQUAT" },
    { name: "Power Clean", category: "OLYMPIC_LIFT", exercise: "POWER_CLEAN" },
  ];
  const base = { rows, muscles: {} as MuscleMap, legacy: [] as LegacyExercise[], sources: ["t"] };
  const find = (c: ReturnType<typeof buildCatalog>, k: string) => c.exercises.find((e) => e.garmin_name === k)!;

  it("se aplican encima de lo importado; los músculos pasan a muscles_source='manual'", () => {
    const c = buildCatalog({ ...base, overrides: { "WARM_UP/THORACIC_ROTATION": { primary_muscles: ["LOWER_BACK"], secondary_muscles: ["OBLIQUES"], name_es: "Rotación de tórax" } } });
    const e = find(c, "THORACIC_ROTATION");
    expect(e.primary_muscles).toEqual(["LOWER_BACK"]);
    expect(e.muscles_source).toBe("manual");
    expect(e.name_es).toBe("Rotación de tórax");
    expect(e.name_es_status).toBe("proposed"); // una propuesta hasta que se marque 'reviewed' en el CSV
  });

  it("una revisión en el CSV ('reviewed') manda sobre la propuesta de un override", () => {
    const csv = parseReviewedNames("garmin_category,garmin_name,name_en,name_es,status\nWARM_UP,THORACIC_ROTATION,Thoracic Rotation,Giro del tórax,reviewed\n");
    const c = buildCatalog({ ...base, reviewedNames: csv, overrides: { "WARM_UP/THORACIC_ROTATION": { name_es: "Rotación de tórax" } } });
    const e = find(c, "THORACIC_ROTATION");
    expect(e.name_es).toBe("Giro del tórax");
    expect(e.name_es_status).toBe("reviewed");
  });

  it("una alternativa inexistente o sin categoría en un override hace fallar el generador", () => {
    expect(() => buildCatalog({ ...base, overrides: { "WARM_UP/THORACIC_ROTATION": { alternatives: ["SQUAT/NO_EXISTE"] } } })).toThrow(/alternativa/);
    expect(() => buildCatalog({ ...base, overrides: { "WARM_UP/THORACIC_ROTATION": { alternatives: ["GOBLET_SQUAT"] } } })).toThrow(/clave completa/);
    const c = buildCatalog({ ...base, overrides: { "WARM_UP/THORACIC_ROTATION": { alternatives: ["SQUAT/GOBLET_SQUAT"] } } });
    expect(c.exercises.find((e) => e.garmin_name === "THORACIC_ROTATION")!.alternatives).toEqual(["SQUAT/GOBLET_SQUAT"]);
  });

  it("un override a un ejercicio inexistente o con un campo no permitido falla", () => {
    expect(() => buildCatalog({ ...base, overrides: { "WARM_UP/NO_EXISTE": { level: 1 } } })).toThrow(/no existe/);
    expect(() => buildCatalog({ ...base, overrides: { "WARM_UP/THORACIC_ROTATION": { legacy_slug: "x" } as unknown as ExerciseOverride } })).toThrow(/no permitido/);
  });

  it("plan_eligible=true exige review_status='reviewed'; olímpicos y pliométricos solo por decisión explícita", () => {
    expect(() => buildCatalog({ ...base, overrides: { "SQUAT/GOBLET_SQUAT": { plan_eligible: true } } })).toThrow(/reviewed/);
    const reviewed = buildCatalog({ ...base, overrides: { "SQUAT/GOBLET_SQUAT": { review_status: "reviewed", level: 2 }, "OLYMPIC_LIFT/POWER_CLEAN": { review_status: "reviewed", level: 3 } } });
    expect(find(reviewed, "GOBLET_SQUAT").plan_eligible).toBe(true);
    expect(find(reviewed, "POWER_CLEAN").plan_eligible).toBe(false); // olímpico: bloqueado salvo decisión explícita
    const explicit = buildCatalog({ ...base, overrides: { "OLYMPIC_LIFT/POWER_CLEAN": { review_status: "reviewed", level: 3, plan_eligible: true } } });
    expect(find(explicit, "POWER_CLEAN").plan_eligible).toBe(true);
  });

  it("fit_sdk_known=false para las claves que el SDK no lista", () => {
    const c = buildCatalog({ ...base, fitUnknown: new Set(["SQUAT/GOBLET_SQUAT"]) });
    expect(find(c, "GOBLET_SQUAT").fit_sdk_known).toBe(false);
    expect(find(c, "THORACIC_ROTATION").fit_sdk_known).toBe(true);
  });
});

describe("contenido priorizado (fase 3): 80 ejercicios en borrador", () => {
  const catalog = load();
  const drafts = catalog.exercises.filter((e) => !e.legacy_slug && e.cues.length > 0);
  const MEDICAL = /lesi[oó]n|dolor|m[eé]dic|terapeut|fisio|patolog|hernia|diagn[oó]st|prevenir|proteger|rehabilit|tratamiento|cura\b|enfermedad|contraindic/i;

  it("son exactamente 80, todos borradores no elegibles para el plan", () => {
    expect(drafts).toHaveLength(80);
    for (const e of drafts) {
      expect(e.review_status).toBe("draft");
      expect(e.plan_eligible).toBe(false);
    }
  });

  it("cada uno trae nombre propuesto en español, nivel, arquetipo, dosis, patrón y material conocido", () => {
    for (const e of drafts) {
      const id = `${e.garmin_category}/${e.garmin_name}`;
      expect(e.name_es_status, id).toBe("proposed");
      expect([1, 2, 3], id).toContain(e.level);
      expect(Object.keys(ARCHETYPES), id).toContain(e.archetype);
      expect(e.dose_default, id).not.toBeNull();
      expect(e.movement_pattern, id).not.toBeNull();
      expect(e.equipment, id).not.toContain("unknown");
    }
  });

  it("claves: 1 a 3, cortas, en imperativo (empiezan en mayúscula) y sin repetirse", () => {
    for (const e of drafts) {
      const id = `${e.garmin_category}/${e.garmin_name}`;
      expect(e.cues.length, id).toBeGreaterThanOrEqual(1);
      expect(e.cues.length, id).toBeLessThanOrEqual(3);
      expect(new Set(e.cues).size, id).toBe(e.cues.length);
      for (const c of e.cues) {
        expect(c.length, `${id}: «${c}»`).toBeLessThanOrEqual(72);
        expect(c[0], `${id}: «${c}»`).toBe(c[0].toUpperCase());
        expect(c.endsWith("."), `${id}: «${c}» sin punto final (son frases cortas)`).toBe(false);
      }
    }
  });

  it("error común con punto final y 1-2 alternativas que existen y no son el propio ejercicio", () => {
    const keys = new Set(catalog.exercises.map((e) => `${e.garmin_category}/${e.garmin_name}`));
    for (const e of drafts) {
      const id = `${e.garmin_category}/${e.garmin_name}`;
      expect(e.common_mistake, id).toMatch(/\.$/);
      expect(e.alternatives.length, id).toBeGreaterThanOrEqual(1);
      expect(e.alternatives.length, id).toBeLessThanOrEqual(2);
      for (const a of e.alternatives) {
        expect(keys.has(a), `${id} → ${a}`).toBe(true);
        expect(a, id).not.toBe(id);
      }
    }
  });

  it("sin consejos médicos ni contraindicaciones inventadas", () => {
    for (const e of drafts) {
      const text = [e.name_es, ...e.cues, e.common_mistake ?? ""].join(" | ");
      expect(text, `${e.garmin_category}/${e.garmin_name}`).not.toMatch(MEDICAL);
      expect(e.contraindications).toEqual([]);
    }
  });

  it("los nombres en español no se repiten entre ejercicios con contenido (curados + propuestos)", () => {
    const names = catalog.exercises.filter((e) => e.legacy_slug || e.cues.length > 0).map((e) => e.name_es.toLowerCase());
    const dup = names.filter((n, i) => names.indexOf(n) !== i);
    expect(dup).toEqual([]);
  });

  it("cubre las zonas prioritarias: movilidad, glúteo, bisagra, core, espalda alta, empuje, tirón, sentadilla/zancada", () => {
    const by = new Map<string, number>();
    for (const e of drafts) by.set(sectionOf(e), (by.get(sectionOf(e)) ?? 0) + 1);
    for (const [section, min] of [["Movilidad", 15], ["Glúteo y cadera", 8], ["Bisagra e isquiotibiales", 4], ["Core", 10], ["Espalda alta y hombros", 8], ["Empuje", 6], ["Sentadilla y zancada", 8]] as const) {
      expect(by.get(section) ?? 0, section).toBeGreaterThanOrEqual(min);
    }
  });

  it("incluye el material del perfil: peso corporal, mancuernas, banda y gimnasio; nada de olímpicos ni pliométricos", () => {
    const eq = new Set(drafts.flatMap((e) => e.equipment));
    for (const need of ["bodyweight", "dumbbell", "band", "cable", "bench"]) expect(eq.has(need), need).toBe(true);
    expect(drafts.filter((e) => ["OLYMPIC_LIFT", "PLYO"].includes(e.garmin_category))).toEqual([]);
  });

  it("los arquetipos asignados que tienen rig listo coinciden con el mapa de animaciones", () => {
    const ready = Object.entries(ARCHETYPES).filter(([, v]) => v.status === "ready").map(([k]) => k);
    expect(ready.length).toBeGreaterThan(0);
    const withRig = drafts.filter((e) => ready.includes(e.archetype ?? ""));
    expect(withRig.length).toBeGreaterThan(0); // hay borradores que podrán animarse con los rigs ya hechos
  });
});
