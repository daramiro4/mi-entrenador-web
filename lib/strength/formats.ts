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
    slug: "circuito",
    name_es: "Circuito",
    blurb: "Varias rondas de los mismos ejercicios, con pausas cortas entre ellos.",
    rules: { rounds: [2, 4], exercise_rest_s: 30, round_rest_s: 75, reps: [8, 12], time_work_s: 40 },
  },
  {
    slug: "amrap",
    name_es: "AMRAP",
    blurb: "Tantas rondas como puedas en un tiempo fijo, a un ritmo que controles.",
    rules: { cap_min: [12, 20], reps: [6, 10], exercise_rest_s: 0, time_work_s: 30 },
  },
  {
    slug: "emom",
    name_es: "EMOM",
    blurb: "Cada minuto, un ejercicio: trabaja ~40 s y descansa lo que sobre.",
    rules: { work_s: 40, minute_s: 60, reps: [6, 10], rounds: [2, 4] },
  },
  {
    slug: "contrarreloj",
    name_es: "Contrarreloj",
    blurb: "Un número fijo de repeticiones por ejercicio; el objetivo es acabar sin perder la técnica.",
    rules: { reps: [8, 12], exercise_rest_s: 20, rounds: [1, 2], time_work_s: 40 },
  },
  {
    slug: "piramide",
    name_es: "Pirámide",
    blurb: "Las repeticiones suben y bajan por escalones; descansas más en la parte alta.",
    rules: { steps: [6, 8, 10, 8, 6], exercise_rest_s: 45, time_work_s: 40 },
  },
];

export const FORMAT_BY_SLUG: Record<FormatSlug, FormatDef> = Object.fromEntries(
  FORMATS.map((f) => [f.slug, f])
) as Record<FormatSlug, FormatDef>;
