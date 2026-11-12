import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { buildFacets, buildIndex, EMPTY_FILTERS, hasActiveFilters, normalize, relevance, searchExercises, type Filters } from "./search";
import { computeWindow, scrollIntoView } from "./virtual-window";
import { keyToWords, watchKey } from "./watch-key";
import { formatClock, remainingSeconds, ringFraction, doseSummary } from "./dose";
import { EQUIPMENT_ES, equipmentLabel, levelShort, muscleLabel } from "./labels";
import { MUSCLE_ES } from "./catalog";
import { rowKey, type ExerciseListRow } from "./ui-types";

const row = (o: Partial<ExerciseListRow>): ExerciseListRow => ({
  id: "x", garmin_category: "SQUAT", garmin_name: "X", name_es: "X", name_en: "X", equipment: ["bodyweight"], primary_muscles: [], level: null, review_status: "draft", archetype: null, ...o,
});
const rows: ExerciseListRow[] = [
  row({ id: "1", garmin_name: "GOBLET_SQUAT", name_es: "Sentadilla goblet", name_en: "Goblet Squat", equipment: ["dumbbell"], primary_muscles: ["QUADS", "GLUTES"], level: 1, review_status: "reviewed" }),
  row({ id: "2", garmin_name: "SUMO_SQUAT", name_es: "Sentadilla sumo", name_en: "Sumo Squat", level: 1 }),
  row({ id: "3", garmin_category: "ROW", garmin_name: "DUMBBELL_ROW", name_es: "Remo con mancuerna", name_en: "Dumbbell Row", equipment: ["dumbbell"], primary_muscles: ["LATS"], level: 2, review_status: "reviewed" }),
  row({ id: "4", garmin_category: "PLANK", garmin_name: "SIDE_PLANK", name_es: "Plancha lateral", name_en: "Side Plank", primary_muscles: ["OBLIQUES"], level: 2 }),
  row({ id: "5", garmin_category: "WARM_UP", garmin_name: "ABS_JABS", name_es: "Abs Jabs", name_en: "Abs Jabs" }),
];
const none = () => false;
const idx = buildIndex(rows, { SQUAT: "Sentadilla", ROW: "Remo", PLANK: "Plancha", WARM_UP: "Calentamiento" });
const f = (o: Partial<Filters>): Filters => ({ ...EMPTY_FILTERS, ...o });
const ids = (o: Partial<Filters>, anim: (r: ExerciseListRow) => boolean = none) => searchExercises(idx, f(o), anim).map((r) => r.id);

describe("búsqueda", () => {
  it("normaliza acentos, mayúsculas y signos", () => {
    expect(normalize("  Rotación TORÁCICA!! ")).toBe("rotacion toracica");
    expect(normalize("Push-up (Kneeling)")).toBe("push up kneeling");
  });
  it("busca en español y en inglés, sin acentos", () => {
    expect(ids({ query: "sentadilla" })).toEqual(["1", "2"]);
    expect(ids({ query: "squat" })).toEqual(["1", "2"]);
    expect(ids({ query: "MANCUERNA" })).toEqual(["3"]);
    expect(ids({ query: "dumbbell" })).toEqual(["3"]);
  });
  it("busca también por la clave de Garmin y por el nombre de la categoría", () => {
    expect(ids({ query: "side plank" })).toEqual(["4"]);
    expect(ids({ query: "calentamiento" })).toEqual(["5"]);
  });
  it("todas las palabras deben aparecer, en cualquier orden", () => {
    expect(ids({ query: "goblet sentadilla" })).toEqual(["1"]);
    expect(ids({ query: "sentadilla remo" })).toEqual([]);
  });
  it("ordena por relevancia: nombre exacto y prefijo antes que 'contiene'", () => {
    const a = relevance(idx[0], "sentadilla goblet");
    const b = relevance(idx[0], "goblet");
    const c = relevance(idx[0], "oble");
    expect(a).toBeGreaterThan(b);
    expect(b).toBeGreaterThan(c);
    expect(relevance(idx[0], "zzz")).toBe(0);
  });
  it("sin consulta: fichas revisadas primero y luego por nombre", () => {
    // revisadas primero (Remo, Sentadilla goblet), luego las que tienen nivel (Plancha, Sentadilla sumo), luego el resto; alfabético dentro de cada grupo
    expect(ids({})).toEqual(["3", "1", "4", "2", "5"]);
  });
});

describe("filtros", () => {
  it("categoría, músculo, material y nivel", () => {
    expect(ids({ category: "SQUAT" })).toEqual(["1", "2"]);
    expect(ids({ muscle: "LATS" })).toEqual(["3"]);
    expect(ids({ equipment: "dumbbell" })).toEqual(["3", "1"]);
    expect(ids({ level: 2 })).toEqual(["3", "4"]);
  });
  it("solo revisados y con animación", () => {
    expect(ids({ onlyReviewed: true })).toEqual(["3", "1"]);
    expect(ids({ withAnimation: true }, (r) => r.id === "1")).toEqual(["1"]);
  });
  it("se combinan (AND) con la consulta", () => {
    expect(ids({ query: "sentadilla", equipment: "dumbbell" })).toEqual(["1"]);
    expect(ids({ query: "sentadilla", level: 2 })).toEqual([]);
  });
  it("hasActiveFilters", () => {
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false);
    expect(hasActiveFilters(f({ query: " " }))).toBe(false);
    expect(hasActiveFilters(f({ level: 1 }))).toBe(true);
    expect(hasActiveFilters(f({ withAnimation: true }))).toBe(true);
  });
  it("facetas con recuento, sobre todas las filas", () => {
    const fa = buildFacets(rows);
    expect(fa.categories[0]).toEqual({ value: "SQUAT", count: 2 });
    expect(fa.equipment.find((e) => e.value === "dumbbell")?.count).toBe(2);
    expect(fa.muscles.map((m) => m.value)).toContain("OBLIQUES");
    expect(fa.levels).toEqual([{ value: 1, count: 2 }, { value: 2, count: 2 }]);
  });
});

describe("rendimiento con el catálogo real (1.553 filas)", () => {
  const catalog = JSON.parse(readFileSync("data/garmin-exercises.json", "utf8")) as { exercises: Record<string, unknown>[] };
  const real: ExerciseListRow[] = catalog.exercises.map((e, i) => ({
    id: String(i), garmin_category: e.garmin_category as string, garmin_name: e.garmin_name as string, name_es: e.name_es as string, name_en: e.name_en as string,
    equipment: e.equipment as string[], primary_muscles: e.primary_muscles as string[], level: e.level as 1 | 2 | 3 | null, review_status: e.review_status as "draft" | "reviewed", archetype: e.archetype as string | null,
  }));
  it("indexa y busca sin problema y devuelve resultados razonables", () => {
    const index = buildIndex(real);
    const t0 = performance.now();
    const res = searchExercises(index, f({ query: "sentadilla" }), none);
    const ms = performance.now() - t0;
    expect(res.length).toBeGreaterThan(5);
    expect(ms).toBeLessThan(150);
    expect(searchExercises(index, f({ query: "squat", equipment: "dumbbell" }), none).length).toBeGreaterThan(5);
  });
  it("todo valor de equipment del catálogo tiene etiqueta en español y todo músculo también", () => {
    for (const e of real) for (const q of e.equipment) expect(EQUIPMENT_ES[q], q).toBeTruthy();
    for (const e of real) for (const m of e.primary_muscles) expect(MUSCLE_ES[m], m).toBeTruthy();
  });
  it("las claves completas son únicas", () => {
    expect(new Set(real.map(rowKey)).size).toBe(real.length);
  });
});

describe("lista virtualizada", () => {
  it("solo se pinta una ventana con margen, nunca las 1.553 filas", () => {
    const w = computeWindow({ count: 1553, itemHeight: 72, scrollTop: 0, viewportHeight: 600 });
    expect(w.start).toBe(0);
    expect(w.end).toBeLessThan(30);
    expect(w.totalHeight).toBe(1553 * 72);
  });
  it("al hacer scroll, la ventana avanza y conserva el margen superior", () => {
    const w = computeWindow({ count: 1553, itemHeight: 72, scrollTop: 72 * 500, viewportHeight: 600, overscan: 6 });
    expect(w.start).toBe(494);
    expect(w.end).toBeGreaterThan(w.start + 8);
    expect(w.offsetTop).toBe(494 * 72);
  });
  it("al final de la lista no se pasa del número de filas; con scroll fuera de rango se acota", () => {
    const w = computeWindow({ count: 100, itemHeight: 50, scrollTop: 99999, viewportHeight: 400 });
    expect(w.end).toBe(100);
    expect(computeWindow({ count: 100, itemHeight: 50, scrollTop: -50, viewportHeight: 400 }).start).toBe(0);
  });
  it("lista vacía o alto 0", () => {
    expect(computeWindow({ count: 0, itemHeight: 72, scrollTop: 0, viewportHeight: 600 })).toEqual({ start: 0, end: 0, totalHeight: 0, offsetTop: 0 });
    expect(computeWindow({ count: 5, itemHeight: 0, scrollTop: 0, viewportHeight: 600 }).end).toBe(0);
  });
  it("scrollIntoView mantiene visible la fila seleccionada", () => {
    expect(scrollIntoView(0, 72, 500, 600)).toBe(0);
    expect(scrollIntoView(20, 72, 0, 600)).toBe(20 * 72 + 72 - 600);
    expect(scrollIntoView(3, 72, 0, 600)).toBe(0);
  });
});

describe("clave del reloj", () => {
  it("formato de la ficha: 'En el reloj: warm up · thoracic rotation'", () => {
    expect(watchKey("WARM_UP", "THORACIC_ROTATION")).toBe("En el reloj: warm up · thoracic rotation");
    expect(keyToWords("_3_WAY_CALF_RAISE")).toBe("3 way calf raise");
  });
  it("si la clave del ejercicio es la de la categoría, no se repite", () => {
    expect(watchKey("SQUAT", "SQUAT")).toBe("En el reloj: squat");
  });
});

describe("cuenta atrás de la dosis", () => {
  it("segundos restantes (redondeo hacia arriba) y fracción del anillo", () => {
    expect(remainingSeconds(40, 0)).toBe(40);
    expect(remainingSeconds(40, 1)).toBe(40);
    expect(remainingSeconds(40, 1001)).toBe(39);
    expect(remainingSeconds(40, 40000)).toBe(0);
    expect(remainingSeconds(40, 99999)).toBe(0);
    expect(ringFraction(40, 0)).toBe(1);
    expect(ringFraction(40, 20000)).toBeCloseTo(0.5, 8);
    expect(ringFraction(40, 80000)).toBe(0);
    expect(ringFraction(0, 0)).toBe(0);
  });
  it("reloj mm:ss y resumen de la dosis", () => {
    expect(formatClock(5)).toBe("00:05");
    expect(formatClock(75)).toBe("01:15");
    expect(formatClock(-3)).toBe("00:00");
    expect(doseSummary({ type: "time", seconds: 40 })).toBe("40 s");
    expect(doseSummary({ type: "reps", reps: 10 })).toBe("10 repeticiones");
  });
});

describe("etiquetas", () => {
  it("material, nivel y músculo", () => {
    expect(equipmentLabel("dumbbell")).toBe("Mancuernas");
    expect(equipmentLabel("raro")).toBe("raro");
    expect(levelShort(2)).toBe("Nivel 2");
    expect(levelShort(null)).toBe("Sin nivel");
    expect(muscleLabel("GLUTES")).toBe("Glúteos");
  });
});
