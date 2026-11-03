import type { FormatSlug } from "./types";

export interface FormatDef {
  slug: FormatSlug;
  name_es: string;
  blurb: string;
  rules: Record<string, unknown>;
}

/** Reglas por formato. Todas las cifras son constantes ajustables. */
export const FORMATS: FormatDef[] = [
  {
    slug: "completa",
    name_es: "Fuerza completa",
    blurb: "Cuerpo completo: 5-7 ejercicios de 3 series con descanso largo. Cada día cambian los ejercicios de cada grupo muscular.",
    rules: { sets: 3, reps: [8, 10], rest_s: [60, 90, 120], time_work_s: 40 },
  },
  {
    slug: "circuito",
    name_es: "Circuito",
    blurb: "Varias rondas de los mismos ejercicios, con pausas cortas entre ellos.",
    rules: { rounds: [2, 4], exercise_rest_s: 30, round_rest_s: 75, reps: [8, 12], time_work_s: 40 },
  },
  {
    slug: "amrap",
    name_es: "AMRAP",
    blurb: "Tantas rondas como puedas en un tiempo fijo, a un ritmo que controles.",
    rules: { cap_min: [10, 40], reps: [6, 10], exercise_rest_s: 0, time_work_s: 30 },
  },
  {
    slug: "emom",
    name_es: "EMOM",
    blurb: "Cada minuto, un ejercicio: trabaja ~40 s y descansa lo que sobre.",
    rules: { work_s: 40, minute_s: 60, reps: [6, 10], rounds: [2, 6] },
  },
  {
    slug: "contrarreloj",
    name_es: "Contrarreloj",
    blurb: "Un número fijo de repeticiones por ejercicio; el objetivo es acabar sin perder la técnica.",
    rules: { reps: [8, 12], exercise_rest_s: 20, rounds: [1, 6], time_work_s: 40 },
  },
  {
    slug: "piramide",
    name_es: "Pirámide",
    blurb: "Las repeticiones suben y bajan por escalones; descansas más en la parte alta.",
    rules: { steps: [6, 8, 10, 8, 6], steps_short: [8, 6], exercise_rest_s: 45, time_work_s: 40 },
  },
];

export const FORMAT_BY_SLUG: Record<FormatSlug, FormatDef> = Object.fromEntries(
  FORMATS.map((f) => [f.slug, f])
) as Record<FormatSlug, FormatDef>;

/**
 * Formatos que se ofrecen al generar. Los demás (circuito, AMRAP, EMOM, contrarreloj, pirámide)
 * siguen en el código para leer entrenos ya guardados y por si se recuperan, pero no se generan.
 */
export const SELECTABLE_FORMATS: FormatDef[] = FORMATS.filter((f) => f.slug === "completa");
