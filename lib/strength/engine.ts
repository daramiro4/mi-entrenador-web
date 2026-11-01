import { EXERCISES, EXERCISE_BY_SLUG } from "./library";
import { FORMAT_BY_SLUG } from "./formats";
import { nextLoad, REP_RANGE } from "./progression";
import { rng } from "./rng";
import { WORKOUT_NAMES } from "./names";
import { validateWorkout, type ValidationContext } from "./validator";
import type { Contraindication, Equipment, Exercise, FormatSlug, Pattern } from "./types";
import type {
  BlockExercise, GenerateInput, GenerateResult, GeneratedWorkout, HistoryEntry, Intensity, WorkoutBlock,
} from "./workout-types";

/** Constantes ajustables del motor. */
export const ENGINE = {
  SEC_PER_REP: 3,
  TRANSITION_S: 10,
  WARMUP_SECONDS: 40,
  WARMUP_REST_S: 5,
  MIN_EXERCISES: 4,
  MAX_EXERCISES: 7,
  MAX_ATTEMPTS: 3,
  /** Orden de prioridad de patrones (pull ≥ push siempre; bisagra y core siempre). */
  PATTERN_ORDER: ["hinge", "pull", "push", "core", "squat", "pull", "carry"] as Pattern[],
  BASE_REPS: { circuito: 10, amrap: 8, emom: 8, contrarreloj: 10, piramide: 8 } as Record<FormatSlug, number>,
};

const WEIGHTED: Equipment[] = ["dumbbell", "barbell", "kettlebell", "machine", "cable"];

export function blockedAreas(input: Pick<GenerateInput, "prefs" | "recentDiscomfort">): Set<Contraindication> {
  return new Set<Contraindication>([
    ...input.prefs.limitations,
    ...input.prefs.excluded_areas,
    ...input.recentDiscomfort,
  ]);
}

export function isEligible(ex: Exercise, input: GenerateInput, conservative = false): boolean {
  if (ex.pattern === "mobility") return false;
  const allowed = new Set<Equipment>([...input.prefs.equipment, "bodyweight"]);
  if (!ex.equipment.some((e) => allowed.has(e))) return false;
  if (ex.level > input.prefs.level) return false;
  const blocked = blockedAreas(input);
  if (ex.contraindications.some((c) => blocked.has(c))) return false;
  if (input.nextDayQuality && ex.leg_load === "heavy") return false;
  if (conservative && ex.leg_load === "heavy" && input.prefs.level === 1) return false;
  return true;
}

function usesWeight(ex: Exercise, input: GenerateInput): boolean {
  const have = new Set(input.prefs.equipment);
  return ex.equipment.some((e) => WEIGHTED.includes(e) && have.has(e));
}

function pickExercises(input: GenerateInput, n: number, rand: () => number, conservative: boolean): Exercise[] {
  const chosen: Exercise[] = [];
  const pool = EXERCISES.filter((e) => isEligible(e, input, conservative));
  const slots = ENGINE.PATTERN_ORDER.slice(0, n);
  const hasPull = pool.some((e) => e.pattern === "pull");
  for (const pattern of slots) {
    // Sin ningún tirón disponible, tampoco se programa empuje (equilibrio empuje:tirón).
    if (pattern === "push" && !hasPull) continue;
    const candidates = pool.filter((e) => e.pattern === pattern && !chosen.includes(e));
    const fallback = pool.filter((e) => e.pattern === "core" && !chosen.includes(e));
    const list = candidates.length ? candidates : pattern === "carry" ? fallback : [];
    if (list.length === 0) continue;
    const scored = list.map((e) => ({
      e,
      score:
        rand() +
        (input.recentSlugs.includes(e.slug) ? 1.5 : 0) +
        Math.abs(input.prefs.level - e.level) * 0.3 +
        (conservative && e.equipment.includes("bodyweight") ? -0.5 : 0),
    }));
    scored.sort((a, b) => a.score - b.score);
    chosen.push(scored[0].e);
  }
  return chosen;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

function exerciseLine(
  ex: Exercise,
  input: GenerateInput,
  format: FormatSlug,
  rest_s: number
): BlockExercise {
  const prev: HistoryEntry | undefined = input.history.find((h) => h.slug === ex.slug);
  const base = ENGINE.BASE_REPS[format];
  const weighted = usesWeight(ex, input);
  const prog = nextLoad(weighted ? prev : prev && { ...prev, weight_kg: null }, base);
  const reps = clamp(prog.reps, REP_RANGE.min - 2, REP_RANGE.max);
  const line: BlockExercise = {
    slug: ex.slug,
    name: ex.name_es,
    pattern: ex.pattern,
    mode: ex.mode,
    sets: 1,
    weight_kg: weighted ? prog.weight_kg : null,
    rest_s,
    note: weighted ? prog.note : prev ? undefined : "Sin carga adicional (peso corporal o banda).",
  };
  if (ex.mode === "time") line.seconds = 40;
  else line.reps = format === "emom" ? Math.min(reps, 10) : reps;
  return line;
}

const exSeconds = (e: BlockExercise, repsOverride?: number) =>
  e.mode === "time" ? (e.seconds ?? 40) : (repsOverride ?? e.reps ?? 10) * ENGINE.SEC_PER_REP + ENGINE.TRANSITION_S;

/** Minutos totales de una rutina, calculados solo a partir de su contenido. */
export function estimateMinutes(w: Pick<GeneratedWorkout, "format" | "blocks">): number {
  let seconds = 0;
  for (const b of w.blocks) {
    if (b.kind !== "main") {
      seconds += b.exercises.reduce((a, e) => a + (e.seconds ?? 40) * e.sets + e.rest_s, 0);
      continue;
    }
    if (w.format === "amrap") {
      seconds += (b.cap_min ?? 15) * 60;
    } else if (w.format === "emom") {
      seconds += (b.rounds ?? 1) * b.exercises.length * 60;
    } else if (w.format === "piramide") {
      seconds += b.exercises.reduce(
        (a, e) => a + (e.rep_scheme ?? [e.reps ?? 10]).reduce((s, r) => s + exSeconds(e, r) + e.rest_s, 0),
        0
      );
    } else {
      const r = b.rounds ?? 1;
      const per = b.exercises.reduce((a, e) => a + exSeconds(e) + e.rest_s, 0);
      seconds += r * per + Math.max(0, r - 1) * (b.round_rest_s ?? 0);
    }
  }
  return Math.round(seconds / 60);
}

function buildMain(format: FormatSlug, exercises: Exercise[], input: GenerateInput, targetMainMin: number): WorkoutBlock {
  const rules = FORMAT_BY_SLUG[format].rules as Record<string, number | number[]>;
  const make = (rest: number) => exercises.map((e) => exerciseLine(e, input, format, rest));

  if (format === "amrap") {
    const lines = make(0);
    const [lo, hi] = rules.cap_min as number[];
    return { kind: "main", title: "AMRAP", cap_min: clamp(Math.round(targetMainMin), lo, hi), exercises: lines };
  }
  if (format === "emom") {
    const lines = make(20);
    const [lo, hi] = rules.rounds as number[];
    const rounds = clamp(Math.round(targetMainMin / lines.length), lo, hi);
    return { kind: "main", title: "EMOM", rounds, exercises: lines };
  }
  if (format === "piramide") {
    const schemes = [rules.steps as number[], rules.steps_short as number[]];
    let bestBlock: WorkoutBlock | null = null;
    let bestDiff = Infinity;
    for (const steps of schemes) {
      const lines = make(rules.exercise_rest_s as number).map((l) =>
        l.mode === "time" ? l : { ...l, rep_scheme: steps, sets: steps.length, reps: undefined }
      );
      const block: WorkoutBlock = { kind: "main", title: "Pirámide", exercises: lines };
      const d = Math.abs(estimateMinutes({ format, blocks: [block] }) - targetMainMin);
      if (d < bestDiff) { bestBlock = block; bestDiff = d; }
    }
    return bestBlock!;
  }
  // circuito / contrarreloj: elige las rondas que mejor encajan.
  const restEx = rules.exercise_rest_s as number;
  const lines = make(restEx);
  const roundRest = format === "circuito" ? (rules.round_rest_s as number) : 0;
  const [lo, hi] = rules.rounds as number[];
  let best = lo;
  let bestDiff = Infinity;
  for (let r = lo; r <= hi; r++) {
    const m = estimateMinutes({ format, blocks: [{ kind: "main", title: "", rounds: r, round_rest_s: roundRest, exercises: lines }] });
    const d = Math.abs(m - targetMainMin);
    if (d < bestDiff) { best = r; bestDiff = d; }
  }
  return { kind: "main", title: format === "circuito" ? "Circuito" : "Contrarreloj", rounds: best, round_rest_s: roundRest, exercises: lines };
}

function buildWarmup(main: Exercise[], input: GenerateInput): WorkoutBlock {
  const blocked = blockedAreas(input);
  const wanted = ["gato-camello", "rotacion-toracica"];
  if (main.some((e) => e.pattern === "hinge" || e.pattern === "squat")) wanted.push("flexor-cadera");
  else if (main.some((e) => e.pattern === "push")) wanted.push("estiramiento-pectoral");
  const exs = wanted
    .map((s) => EXERCISE_BY_SLUG[s])
    .filter((e) => e && !e.contraindications.some((c) => blocked.has(c)));
  const safe = exs.length >= 2 ? exs : [EXERCISE_BY_SLUG["flexor-cadera"], EXERCISE_BY_SLUG["rotacion-toracica"]].filter((e) => !e.contraindications.some((c) => blocked.has(c)));
  return {
    kind: "warmup",
    title: "Calentamiento",
    exercises: safe.map((e) => ({
      slug: e.slug, name: e.name_es, pattern: e.pattern, mode: "time", sets: 1,
      seconds: ENGINE.WARMUP_SECONDS, weight_kg: null, rest_s: ENGINE.WARMUP_REST_S,
    })),
  };
}

function intensityFor(input: GenerateInput): Intensity {
  if (input.prefs.level === 1 || input.prefs.limitations.length > 0) return "suave";
  if (input.format === "amrap" || input.format === "contrarreloj" || input.prefs.level === 3) return "intensa";
  return "moderada";
}

function pickName(input: GenerateInput, rand: () => number): string {
  const fresh = WORKOUT_NAMES.filter((n) => !input.recentNames.includes(n));
  const list = fresh.length ? fresh : WORKOUT_NAMES;
  return list[Math.floor(rand() * list.length)];
}

/** Un intento de generación por reglas (determinista dada la semilla). */
export function generateOnce(input: GenerateInput, attempt: number): GeneratedWorkout {
  const rand = rng(input.seed + attempt * 7919);
  const conservative = attempt >= ENGINE.MAX_ATTEMPTS;
  const target = input.prefs.session_minutes;
  let best: GeneratedWorkout | null = null;
  let bestDiff = Infinity;
  const nMax = conservative ? ENGINE.MIN_EXERCISES : ENGINE.MAX_EXERCISES;
  const picks = new Map<number, Exercise[]>();
  for (let n = ENGINE.MIN_EXERCISES; n <= nMax; n++) picks.set(n, pickExercises(input, n, rng(input.seed + attempt * 7919 + n), conservative));

  for (const [, exs] of picks) {
    if (exs.length < 3) continue;
    const warmup = buildWarmup(exs, input);
    const warmMin = estimateMinutes({ format: input.format, blocks: [warmup] });
    const main = buildMain(input.format, exs, input, Math.max(8, target - warmMin));
    const w: GeneratedWorkout = {
      name: pickName(input, rand),
      format: input.format,
      duration_min: 0,
      requested_min: target,
      intensity: intensityFor(input),
      blocks: [warmup, main],
    };
    w.duration_min = estimateMinutes(w);
    const diff = Math.abs(w.duration_min - target);
    if (diff < bestDiff) { best = w; bestDiff = diff; }
  }
  if (!best) throw new Error("No hay ejercicios elegibles con el equipamiento y limitaciones indicados.");
  return best;
}

/** Genera con reglas + validador; hasta 3 intentos, registrando el motivo de cada rechazo. */
export function generateWorkout(input: GenerateInput): GenerateResult {
  const attempts: GenerateResult["attempts"] = [];
  const ctx: ValidationContext = {
    prefs: input.prefs,
    history: input.history,
    blocked: blockedAreas(input),
    nextDayQuality: input.nextDayQuality,
  };
  for (let attempt = 1; attempt <= ENGINE.MAX_ATTEMPTS; attempt++) {
    try {
      const w = generateOnce(input, attempt);
      const result = validateWorkout(w, ctx);
      attempts.push({ attempt, errors: result.errors });
      if (result.ok) return { workout: w, attempts };
    } catch (err) {
      attempts.push({ attempt, errors: [err instanceof Error ? err.message : "error desconocido"] });
    }
  }
  return { workout: null, attempts };
}
