import { EXERCISE_BY_SLUG } from "./library";
import { MAX_LOAD_INCREASE } from "./progression";
import type { Contraindication, Equipment } from "./types";
import type { GeneratedWorkout, HistoryEntry, Prefs } from "./workout-types";

export const VALIDATION = {
  /** Series máximas por patrón de movimiento en una rutina. */
  MAX_SETS_PER_PATTERN: 12,
  /** Tolerancia de duración respecto a lo pedido. */
  DURATION_TOLERANCE: 0.15,
  /** Rondas que se asumen en un AMRAP para contar volumen. */
  AMRAP_ASSUMED_ROUNDS: 4,
};

export interface ValidationContext {
  prefs: Prefs;
  history: HistoryEntry[];
  blocked: Set<Contraindication>;
  nextDayQuality?: boolean;
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

/** Validador de seguridad: toda rutina (reglas o IA) pasa por aquí antes de guardarse. */
export function validateWorkout(w: GeneratedWorkout, ctx: ValidationContext): ValidationResult {
  const errors: string[] = [];
  const allowed = new Set<Equipment>([...ctx.prefs.equipment, "bodyweight"]);

  const warm = w.blocks.find((b) => b.kind === "warmup");
  if (!warm || warm.exercises.length < 2) errors.push("Falta el calentamiento (mínimo 2 ejercicios).");

  const setsByPattern: Record<string, number> = {};
  const main = w.blocks.filter((b) => b.kind === "main");
  if (main.length === 0) errors.push("Falta el bloque principal.");

  for (const block of w.blocks) {
    for (const line of block.exercises) {
      const ex = EXERCISE_BY_SLUG[line.slug];
      if (!ex) {
        errors.push(`Ejercicio inexistente: ${line.slug}.`);
        continue;
      }
      if (!ex.equipment.some((e) => allowed.has(e))) errors.push(`${ex.name_es}: requiere equipamiento que no tienes.`);
      const clash = ex.contraindications.filter((c) => ctx.blocked.has(c));
      if (clash.length) errors.push(`${ex.name_es}: contraindicado por ${clash.join(", ")}.`);
      if (ctx.nextDayQuality && ex.leg_load === "heavy") errors.push(`${ex.name_es}: pierna pesada con bici de calidad mañana.`);
      if (block.kind === "main") {
        const rounds = w.format === "amrap" ? VALIDATION.AMRAP_ASSUMED_ROUNDS : (block.rounds ?? 1);
        setsByPattern[ex.pattern] = (setsByPattern[ex.pattern] ?? 0) + line.sets * rounds;
      }
      const prev = ctx.history.find((h) => h.slug === line.slug);
      if (prev?.weight_kg && line.weight_kg != null && line.weight_kg > prev.weight_kg * (1 + MAX_LOAD_INCREASE) + 1e-9) {
        errors.push(`${ex.name_es}: la carga sube más de un ${MAX_LOAD_INCREASE * 100} %.`);
      }
    }
  }

  for (const [pattern, sets] of Object.entries(setsByPattern)) {
    if (sets > VALIDATION.MAX_SETS_PER_PATTERN) errors.push(`Demasiado volumen de ${pattern}: ${sets} series.`);
  }
  const patternsInMain = new Set(main.flatMap((b) => b.exercises.map((l) => l.pattern)));
  if (!patternsInMain.has("hinge")) errors.push("Falta un ejercicio de bisagra de cadera.");
  if (!patternsInMain.has("core")) errors.push("Falta un ejercicio de core.");
  if ((setsByPattern.push ?? 0) > (setsByPattern.pull ?? 0)) errors.push("Desequilibrio: más empuje que tirón.");

  const diff = Math.abs(w.duration_min - w.requested_min) / w.requested_min;
  if (diff > VALIDATION.DURATION_TOLERANCE) {
    errors.push(`Duración ${w.duration_min} min fuera de ±${VALIDATION.DURATION_TOLERANCE * 100} % de ${w.requested_min} min.`);
  }
  return { ok: errors.length === 0, errors };
}
