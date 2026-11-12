import { explicitEquipment, type Catalog, type CatalogExercise } from "./catalog";

/**
 * Informe (solo lectura) del emparejamiento de las fichas curadas del módulo de fuerza con las claves de Garmin:
 * para cada ficha, la clave asignada, 3 candidatas por parecido de nombre y material, y avisos. NO cambia nada.
 * `INTENT_EN` es la intención de cada ficha en inglés (lo que el ejercicio ES, no lo que Garmin llame a la clave).
 */
export const INTENT_EN: Record<string, string> = {
  "bird-dog": "Bird dog quadruped opposite arm and leg",
  "buenos-dias-mancuerna": "Dumbbell good morning",
  "curl-biceps": "Dumbbell biceps curl",
  "dead-bug": "Dead bug",
  "dominadas-asistidas": "Assisted pull-up",
  "elevacion-talones": "Standing calf raise",
  "estiramiento-pectoral": "Doorway chest stretch",
  "face-pull-banda": "Band face pull",
  flexiones: "Push-up",
  "flexiones-inclinadas": "Incline push-up",
  "flexor-cadera": "Lunging hip flexor stretch",
  "gato-camello": "Cat cow stretch",
  "hip-thrust": "Dumbbell hip thrust",
  "jalon-pecho": "Lat pulldown",
  pallof: "Pallof press",
  "paseo-granjero": "Farmer's carry",
  "peso-muerto-barra": "Barbell deadlift",
  "peso-muerto-kettlebell": "Kettlebell deadlift",
  "peso-muerto-rumano": "Dumbbell romanian deadlift",
  "peso-muerto-una-pierna": "Single-leg romanian deadlift with dumbbell",
  plancha: "Plank",
  "prensa-piernas": "Leg press",
  "press-banda-pecho": "Band chest press",
  "press-hombro-mancuernas": "Dumbbell shoulder press",
  "press-mancuernas": "Dumbbell bench press",
  "puente-gluteo": "Glute bridge bodyweight",
  "puente-gluteo-una-pierna": "Single-leg glute bridge",
  "remo-banda": "Band row",
  "remo-invertido": "Inverted row",
  "remo-mancuerna": "Dumbbell row",
  "retraccion-cervical": "Neck retraction chin tuck",
  "rotacion-toracica": "Thoracic rotation quadruped",
  "sentadilla-bulgara": "Dumbbell bulgarian split squat",
  "sentadilla-caja": "Box squat",
  "sentadilla-goblet": "Goblet squat",
  "sentadilla-isometrica-pared": "Wall sit squat",
  "sentadilla-peso-corporal": "Bodyweight squat",
  "subida-cajon": "Step-up on box",
  superman: "Superman back extension on floor",
  zancada: "Lunge",
  "zancada-atras": "Reverse lunge",
};

const STOP = new Set(["with", "on", "the", "a", "an", "of", "to", "from", "and", "in"]);
const stem = (w: string) => (w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w);
export const tokens = (s: string): Set<string> =>
  new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .split(" ")
      .filter((w) => w && !STOP.has(w))
      .map(stem),
  );
export function jaccard(a: Set<string>, b: Set<string>): number {
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

export interface Candidate {
  key: string;
  name_en: string;
  equipment: string[];
  score: number;
}

/** Parecido de nombre (Jaccard) + ajuste por material: coincidir suma, exigir material que la ficha no tiene resta. */
export function scoreCandidate(intent: string, ficha: { equipment: string[] }, c: CatalogExercise, assignedCategory: string): number {
  let score = jaccard(tokens(intent), tokens(c.name_en));
  const explicit = explicitEquipment(c.garmin_category, c.garmin_name);
  const wanted = new Set(ficha.equipment);
  if (explicit.length > 0) score += explicit.some((e) => wanted.has(e)) ? 0.15 : -0.25;
  else if (wanted.has("bodyweight")) score += 0.1;
  if (c.garmin_category === assignedCategory) score += 0.05;
  return Math.round(score * 1000) / 1000;
}

export function candidatesFor(slug: string, catalog: Catalog, ficha: CatalogExercise): Candidate[] {
  const intent = INTENT_EN[slug];
  return catalog.exercises
    .filter((c) => !(c.garmin_category === ficha.garmin_category && c.garmin_name === ficha.garmin_name))
    .map((c) => ({ key: `${c.garmin_category}/${c.garmin_name}`, name_en: c.name_en, equipment: c.equipment, score: scoreCandidate(intent, ficha, c, ficha.garmin_category) }))
    .sort((a, b) => b.score - a.score || a.key.localeCompare(b.key))
    .slice(0, 3);
}

export function warningsFor(slug: string, ficha: CatalogExercise): string[] {
  const w: string[] = [];
  // 'bodyweight' explícito en la clave (BODY_WEIGHT) no es un material: coincide con una ficha de peso corporal.
  const explicit = explicitEquipment(ficha.garmin_category, ficha.garmin_name).filter((e) => e !== "bodyweight");
  const wanted = new Set(ficha.equipment);
  if (explicit.length > 0 && !explicit.some((e) => wanted.has(e))) {
    w.push(`MATERIAL: la clave implica «${explicit.join(", ")}» y la ficha dice «${ficha.equipment.join(", ")}».`);
  } else if (explicit.length > 0 && ficha.equipment.length === 1 && ficha.equipment[0] === "bodyweight") {
    w.push(`MATERIAL: la ficha es solo peso corporal pero la clave implica «${explicit.join(", ")}».`);
  }
  const sim = jaccard(tokens(INTENT_EN[slug]), tokens(ficha.name_en));
  if (sim < 0.5) w.push(`NOMBRE: «${ficha.name_en}» se parece poco a lo que es la ficha («${INTENT_EN[slug]}», similitud ${sim.toFixed(2)}).`);
  if (ficha.garmin_category === ficha.garmin_name) w.push("GENÉRICA: la clave coincide con la categoría (Garmin muestra solo el nombre de la categoría).");
  return w;
}

export function buildCuratedReview(catalog: Catalog): string {
  const curated = catalog.exercises.filter((e) => e.legacy_slug).sort((a, b) => a.legacy_slug!.localeCompare(b.legacy_slug!));
  const withWarnings = curated.filter((e) => warningsFor(e.legacy_slug!, e).length > 0).length;
  const out: string[] = [
    "# Revisión del emparejamiento de las fichas curadas",
    "",
    "> GENERADO (`npm run gen:exercise-catalog`). **Solo informe: no cambia nada.** Decide el responsable.",
    "",
    `Cada una de las ${curated.length} fichas curadas del módulo de fuerza apunta a una clave de Garmin. Para cada una: la clave asignada, 3 candidatas por parecido de nombre (en inglés, según la intención de la ficha) y material, y avisos.`,
    `**${withWarnings} de ${curated.length} fichas tienen al menos un aviso.** El parecido es heurístico (Jaccard de palabras ± material): úsalo como pista, no como veredicto.`,
    "",
    "Para cambiar un emparejamiento hay que tocar `lib/strength/garmin-overrides.ts` (y, si la ficha cambia de clave, el seed del módulo de fuerza); este informe no lo hace.",
    "",
  ];
  for (const e of curated) {
    const slug = e.legacy_slug!;
    const warns = warningsFor(slug, e);
    out.push(`## ${e.name_es} \`${slug}\`${warns.length ? " ⚠" : ""}`);
    out.push("");
    out.push(`- **Intención (EN):** ${INTENT_EN[slug]} · **Material de la ficha:** ${e.equipment.join(", ")} · **Patrón:** ${e.movement_pattern}`);
    out.push(`- **Clave asignada:** \`${e.garmin_category}/${e.garmin_name}\` — «${e.name_en}» (material por la clave: ${explicitEquipment(e.garmin_category, e.garmin_name).join(", ") || "sin pista"})`);
    for (const w of warns) out.push(`- ⚠ ${w}`);
    out.push("- **Candidatas:**");
    for (const c of candidatesFor(slug, catalog, e)) out.push(`  - \`${c.key}\` — «${c.name_en}» · material: ${c.equipment.join(", ")} · puntuación ${c.score.toFixed(2)}`);
    out.push("");
  }
  return out.join("\n");
}
