import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { EXERCISES } from "../strength/library";
import { GARMIN_OVERRIDES } from "../strength/garmin-overrides";
import {
  buildCatalog,
  buildMigrationSql,
  buildNamesCsv,
  deriveEquipment,
  MIGRATION_FILE,
  parseReviewedNames,
  type Catalog,
  type LegacyExercise,
  type MuscleMap,
  type RawRow,
} from "./catalog";
import { CATEGORY_ES, translateName } from "./names-es";

const DATA = "data/garmin-exercises.json";
const NAMES = "data/exercise-names-es.csv";

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
  return buildCatalog({ rows: gc.rows, muscles: mu.categories, legacy, reviewedNames, sources: [gc.source, mu.source] });
}

describe("catálogo de ejercicios (generado)", () => {
  const catalog = load();

  it("los ficheros versionados coinciden con lo generado (UPDATE_CATALOG=1 / npm run gen:exercise-catalog para regenerar)", () => {
    const json = JSON.stringify(catalog, null, 1) + "\n";
    const csv = buildNamesCsv(catalog);
    const sql = buildMigrationSql(catalog);
    if (process.env.UPDATE_CATALOG === "1") {
      writeFileSync(DATA, json);
      writeFileSync(NAMES, csv);
      writeFileSync(MIGRATION_FILE, sql);
    }
    expect(readFileSync(DATA, "utf8")).toBe(json);
    expect(readFileSync(NAMES, "utf8")).toBe(csv);
    expect(readFileSync(MIGRATION_FILE, "utf8")).toBe(sql);
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

  it("solo las fichas curadas son 'reviewed'; el resto es borrador y no lleva técnica inventada", () => {
    for (const e of catalog.exercises.filter((x) => !x.legacy_slug)) {
      expect(e.review_status).toBe("draft");
      expect(e.level).toBeNull();
      expect(e.cues).toEqual([]);
      expect(e.common_mistake).toBeNull();
      expect(e.contraindications).toEqual([]);
    }
  });

  it("todo ejercicio tiene equipo y nombre", () => {
    for (const e of catalog.exercises) {
      expect(e.equipment.length, e.garmin_name).toBeGreaterThan(0);
      expect(e.name_en && e.name_es).toBeTruthy();
    }
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
    expect(deriveEquipment("PLANK", "PLANK")).toEqual(["bodyweight"]);
    expect(deriveEquipment("BANDED_EXERCISES", "SQUAT")).toEqual(["band"]);
    expect(deriveEquipment("PULL_UP", "PULL_UP")).toEqual(["pull_up_bar"]);
    expect(deriveEquipment("PULL_UP", "BANDED_PULL_UP")).toEqual(["band"]);
  });
  it("no confunde palabras que contienen otra (BANDED≠BAND dentro de otra palabra)", () => {
    expect(deriveEquipment("CORE", "HUSBANDRY")).toEqual(["bodyweight"]);
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
