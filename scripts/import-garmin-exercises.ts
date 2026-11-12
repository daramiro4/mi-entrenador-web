/**
 * Importa las FUENTES del catálogo de ejercicios de Garmin. Es el único paso con red; el resto del pipeline
 * (lib/exercises/catalog.ts, `npm run gen:exercise-catalog`) trabaja sobre los ficheros que escribe este script.
 *
 *   node scripts/import-garmin-exercises.ts              # escribe data/sources/*.json
 *   node scripts/import-garmin-exercises.ts --fit-sdk    # además baja el FIT SDK a .cache/ (solo para validar, NO se versiona)
 *
 * Fuentes (ver docs/exercise-library.md para licencias):
 *  1. python-garminconnect (MIT), el mismo catálogo que usa el bot: clave de categoría + clave de ejercicio + nombre visible.
 *  2. Exercises.json de Garmin Connect (fichero público del editor de entrenos, sin login): SOLO músculos por ejercicio.
 *  3. FIT SDK (@garmin/fitsdk): solo con --fit-sdk, para el validador. Su licencia prohíbe redistribuirlo: no se guarda en el repo.
 *
 * Importa solo claves, nombres y metadatos. No toca imágenes ni vídeos de Garmin ni nada tras login.
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Misma versión que fija el bot (mi-entrenador-garmin) para que las claves sean las que acepta su librería.
export const GARMINCONNECT_VERSION = "0.3.20";
export const CONNECT_EXERCISES_URL = "https://connect.garmin.com/web-data/exercises/Exercises.json";

export interface RawRow {
  name: string;
  category: string;
  exercise: string;
}

/** Extrae las filas `_RAW` (nombre visible, categoría, ejercicio) del exercises.py de garminconnect. */
export function parseGarminconnectExercises(py: string): RawRow[] {
  const re = /\(\s*("(?:[^"\\]|\\.)*")\s*,\s*"([A-Z0-9_]+)"\s*,\s*"([A-Z0-9_]*)"\s*,?\s*\)/g; // las tuplas largas llevan coma final
  const rows: RawRow[] = [];
  const start = py.indexOf("_RAW");
  const end = py.indexOf("\nCATEGORIES", start);
  const body = py.slice(start, end === -1 ? undefined : end);
  for (const m of body.matchAll(re)) rows.push({ name: JSON.parse(m[1]) as string, category: m[2], exercise: m[3] });
  return rows;
}

export interface MuscleSource {
  categories: Record<string, Record<string, { p: string[]; s: string[] }>>;
}

/** Reduce Exercises.json a categoría → ejercicio → músculos (descarta todo lo demás). */
export function reduceMuscles(json: { categories: Record<string, { exercises: Record<string, { primaryMuscles?: string[]; secondaryMuscles?: string[] }> }> }): MuscleSource {
  const categories: MuscleSource["categories"] = {};
  for (const cat of Object.keys(json.categories).sort()) {
    categories[cat] = {};
    const ex = json.categories[cat].exercises ?? {};
    for (const key of Object.keys(ex).sort()) {
      categories[cat][key] = { p: [...(ex[key].primaryMuscles ?? [])], s: [...(ex[key].secondaryMuscles ?? [])] };
    }
  }
  return { categories };
}

/** camelCase del FIT SDK → UPPER_SNAKE de Garmin Connect. */
export function fitNameToKey(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toUpperCase();
}

/** Clave canónica para comparar entre fuentes (sin guiones bajos: L_SIT = LSIT, AT_90 = AT90). */
const canonical = (k: string): string => k.replace(/_/g, "");

/**
 * Claves del catálogo (unión de garminconnect y Exercises.json) que el FIT SDK no lista: Garmin Connect las acepta pero el
 * SDK 21.x es anterior. Se guarda SOLO la lista de claves nuestras que faltan (nada del contenido del SDK).
 */
export function computeFitUnknown(official: { category: string; exercise: string }[], fit: Record<string, string[]>): string[] {
  const known = new Set(Object.entries(fit).flatMap(([c, names]) => names.map((n) => `${c}/${canonical(n)}`)));
  const unknown = new Set<string>();
  for (const k of official) if (!known.has(`${k.category}/${canonical(k.exercise)}`)) unknown.add(`${k.category}/${k.exercise}`);
  return [...unknown].sort();
}

async function download(url: string): Promise<Buffer> {
  const res = await fetch(url, { headers: { "User-Agent": "mi-entrenador-web/exercise-import" } });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function importGarminconnect(): Promise<void> {
  const meta = JSON.parse((await download(`https://pypi.org/pypi/garminconnect/${GARMINCONNECT_VERSION}/json`)).toString()) as {
    urls: { packagetype: string; url: string; digests: { sha256: string } }[];
  };
  const wheel = meta.urls.find((u) => u.packagetype === "bdist_wheel");
  if (!wheel) throw new Error("garminconnect: no hay wheel en PyPI");
  const buf = await download(wheel.url);
  const sha = createHash("sha256").update(buf).digest("hex");
  if (sha !== wheel.digests.sha256) throw new Error("garminconnect: el sha256 de la wheel no coincide con PyPI");
  const dir = mkdtempSync(join(tmpdir(), "gc-"));
  const file = join(dir, "gc.whl");
  writeFileSync(file, buf);
  const py = execFileSync("unzip", ["-p", file, "garminconnect/exercises.py"], { maxBuffer: 64 * 1024 * 1024 }).toString();
  const rows = parseGarminconnectExercises(py);
  const declared = /Contains (\d+) exercises across (\d+) categories/.exec(py);
  if (declared && Number(declared[1]) !== rows.length) {
    throw new Error(`garminconnect declara ${declared[1]} ejercicios y se parsearon ${rows.length}`);
  }
  rows.sort((a, b) => a.category.localeCompare(b.category) || a.exercise.localeCompare(b.exercise));
  const out = {
    source: `python-garminconnect ${GARMINCONNECT_VERSION} (MIT)`,
    wheel_sha256: sha,
    rows,
  };
  writeFileSync("data/sources/garminconnect-exercises.json", JSON.stringify(out, null, 1) + "\n");
  console.log(`garminconnect ${GARMINCONNECT_VERSION}: ${rows.length} ejercicios, ${new Set(rows.map((r) => r.category)).size} categorías`);
}

async function importMuscles(): Promise<void> {
  const json = JSON.parse((await download(CONNECT_EXERCISES_URL)).toString());
  const reduced = reduceMuscles(json);
  const count = Object.values(reduced.categories).reduce((a, c) => a + Object.keys(c).length, 0);
  writeFileSync(
    "data/sources/connect-exercise-muscles.json",
    JSON.stringify({ source: "Garmin Connect Exercises.json (público, solo músculos)", url: CONNECT_EXERCISES_URL, ...reduced }, null, 1) + "\n",
  );
  console.log(`Exercises.json: ${count} ejercicios con metadatos de músculos, ${Object.keys(reduced.categories).length} categorías`);
}

async function importFitSdk(): Promise<void> {
  const dir = mkdtempSync(join(tmpdir(), "fit-"));
  execFileSync("npm", ["pack", "@garmin/fitsdk", "--silent"], { cwd: dir });
  const tgz = execFileSync("ls", [dir]).toString().split("\n").find((f) => f.endsWith(".tgz"));
  if (!tgz) throw new Error("npm pack no produjo el tarball del FIT SDK");
  execFileSync("tar", ["-xzf", tgz], { cwd: dir });
  const pkgDir = join(dir, "package");
  const version = (JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf8")) as { version: string }).version;
  const { createRequire } = await import("node:module");
  type Enums = Record<string, Record<string, string>>;
  const mod = createRequire(join(pkgDir, "x.js"))("./src/profile.js") as Record<string, unknown>;
  // Según la versión del SDK, los enums cuelgan de `types`, `default.types` o `Profile.types`.
  const holder = (mod.types ?? (mod.default as Record<string, unknown> | undefined)?.types ?? (mod.Profile as Record<string, unknown> | undefined)?.types ?? mod) as Enums;
  const T = holder;
  const categories: Record<string, string[]> = {};
  for (const catName of Object.values(T.exerciseCategory)) {
    const enumKey = `${catName}ExerciseName`;
    categories[fitNameToKey(catName)] = T[enumKey] ? Object.values(T[enumKey]).map(fitNameToKey).sort() : [];
  }
  mkdirSync(".cache", { recursive: true });
  writeFileSync(".cache/fit-exercise-keys.json", JSON.stringify({ source: `@garmin/fitsdk ${version}`, categories }, null, 1) + "\n");
  const total = Object.values(categories).reduce((a, c) => a + c.length, 0);
  const gc = JSON.parse(readFileSync("data/sources/garminconnect-exercises.json", "utf8")) as { rows: RawRow[] };
  const mu = JSON.parse(readFileSync("data/sources/connect-exercise-muscles.json", "utf8")) as MuscleSource;
  const official = [
    ...gc.rows.map((r) => ({ category: r.category, exercise: r.exercise })),
    ...Object.entries(mu.categories).flatMap(([c, ex]) => Object.keys(ex).map((e) => ({ category: c, exercise: e }))),
  ];
  const unknownKeys = computeFitUnknown(official, categories);
  writeFileSync(
    "data/sources/fit-sdk-unknown-keys.json",
    JSON.stringify({ fit_sdk_version: version, note: "Claves de Garmin Connect que ese FIT SDK no lista (solo nuestras claves; sin contenido del SDK).", keys: unknownKeys }, null, 1) + "\n",
  );
  console.log(`FIT SDK ${version}: ${unknownKeys.length} claves de Connect que el SDK aún no lista (data/sources/fit-sdk-unknown-keys.json)`);
  console.log(`FIT SDK ${version}: ${Object.keys(categories).length} categorías, ${total} nombres (guardado en .cache/, no se versiona)`);
}

async function main(): Promise<void> {
  mkdirSync("data/sources", { recursive: true });
  await importGarminconnect();
  await importMuscles();
  if (process.argv.includes("--fit-sdk")) await importFitSdk();
}

// Solo se ejecuta como script (los tests importan las funciones puras sin lanzar la red).
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  main().catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  });
}
