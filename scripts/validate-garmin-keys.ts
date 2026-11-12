/**
 * Valida que cada (garmin_category, garmin_name) del catálogo existe en las fuentes oficiales.
 *
 *   node scripts/validate-garmin-keys.ts              # contra las fuentes versionadas (offline)
 *   node scripts/validate-garmin-keys.ts --fit-sdk    # además contra el FIT SDK (.cache/, ver import-garmin-exercises.ts)
 *
 * También comprueba que la migración SQL inserta exactamente las filas del catálogo (lo que acabará en la BD).
 * ERROR (exit 1): una clave del catálogo que NO existe en garminconnect ni en Exercises.json (Garmin la rechazaría).
 * AVISO: una clave que no está en el FIT SDK 21.x (Connect puede ser más reciente que el SDK); no falla.
 * Función pura aparte: validateKeys().
 */
import { existsSync, readFileSync } from "node:fs";

export interface Key {
  garmin_category: string;
  garmin_name: string;
}
export interface KeyReport {
  errors: string[];
  notInFit: string[];
}

/** Clave canónica para comparar entre fuentes: sin guiones bajos (L_SIT = LSIT, AT_90 = AT90, _3_WAY = 3_WAY). */
export const canonical = (k: string): string => k.replace(/_/g, "");

export function validateKeys(catalog: Key[], official: Key[], fit?: Record<string, string[]>): KeyReport {
  const ok = new Set(official.map((k) => `${k.garmin_category}/${canonical(k.garmin_name)}`));
  const fitSet = fit ? new Set(Object.entries(fit).flatMap(([c, names]) => names.map((n) => `${c}/${canonical(n)}`))) : null;
  const errors: string[] = [];
  const notInFit: string[] = [];
  const seen = new Set<string>();
  for (const k of catalog) {
    const id = `${k.garmin_category}/${k.garmin_name}`;
    if (seen.has(id)) errors.push(`duplicada: ${id}`);
    seen.add(id);
    if (!ok.has(`${k.garmin_category}/${canonical(k.garmin_name)}`)) errors.push(`no existe en las fuentes oficiales: ${id}`);
    if (fitSet && !fitSet.has(`${k.garmin_category}/${canonical(k.garmin_name)}`)) notInFit.push(id);
  }
  return { errors, notInFit };
}

/** Filas (categoría, nombre) que inserta la migración SQL en `public.exercises`. */
export function keysFromMigration(sql: string): Key[] {
  const keys: Key[] = [];
  const blocks = sql.split("insert into public.exercises (").slice(1);
  for (const block of blocks) {
    const body = block.slice(block.indexOf("values") + 6, block.indexOf(";\n"));
    for (const m of body.matchAll(/^\s*\('((?:[^']|'')*)', '((?:[^']|'')*)'/gm)) {
      keys.push({ garmin_category: m[1].replace(/''/g, "'"), garmin_name: m[2].replace(/''/g, "'") });
    }
  }
  return keys;
}

function main(): void {
  const catalog = JSON.parse(readFileSync("data/garmin-exercises.json", "utf8")) as { exercises: Key[] };
  const gc = JSON.parse(readFileSync("data/sources/garminconnect-exercises.json", "utf8")) as { rows: { category: string; exercise: string }[] };
  const mu = JSON.parse(readFileSync("data/sources/connect-exercise-muscles.json", "utf8")) as { categories: Record<string, Record<string, unknown>> };
  const official: Key[] = [
    ...gc.rows.map((r) => ({ garmin_category: r.category, garmin_name: r.exercise })),
    ...Object.entries(mu.categories).flatMap(([c, ex]) => Object.keys(ex).map((e) => ({ garmin_category: c, garmin_name: e }))),
  ];
  const useFit = process.argv.includes("--fit-sdk");
  let fit: Record<string, string[]> | undefined;
  if (useFit) {
    if (!existsSync(".cache/fit-exercise-keys.json")) throw new Error("Falta .cache/fit-exercise-keys.json: ejecuta antes import-garmin-exercises.ts --fit-sdk");
    fit = (JSON.parse(readFileSync(".cache/fit-exercise-keys.json", "utf8")) as { categories: Record<string, string[]> }).categories;
  }

  const report = validateKeys(catalog.exercises, official, fit);
  const sql = readFileSync("supabase/migrations/20261112120000_exercise_catalog.sql", "utf8");
  const dbKeys = keysFromMigration(sql);
  const dbReport = validateKeys(dbKeys, official, fit);
  if (dbKeys.length !== catalog.exercises.length) report.errors.push(`la migración inserta ${dbKeys.length} filas y el catálogo tiene ${catalog.exercises.length}`);
  report.errors.push(...dbReport.errors.map((e) => `[migración] ${e}`));

  console.log(`catálogo: ${catalog.exercises.length} ejercicios · migración: ${dbKeys.length} filas`);
  if (fit) console.log(`FIT SDK: ${report.notInFit.length} claves del catálogo no están en el SDK (avisos, p. ej. ejercicios más nuevos en Connect)`);
  if (report.errors.length) {
    console.error(`ERRORES (${report.errors.length}):\n  ` + report.errors.slice(0, 30).join("\n  "));
    process.exit(1);
  }
  console.log("OK: todas las claves existen en las fuentes oficiales.");
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) main();
