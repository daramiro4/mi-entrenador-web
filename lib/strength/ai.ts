import { EXERCISES, EXERCISE_BY_SLUG } from "./library";
import { blockedAreas, generateFromExercises, generateWorkout, isEligible } from "./engine";
import { validateWorkout } from "./validator";
import { FORMAT_BY_SLUG } from "./formats";
import type { GenerateInput, GenerateResult } from "./workout-types";

/** Modelo de la capa IA (el mismo que ya usa la narrativa semanal en producción). */
export const AI_MODEL = "gemini-3.6-flash";

export interface AiPick {
  name: string;
  exercises: string[];
  guidance: string;
}

/** La IA solo puede elegir slugs, nombrar la rutina y redactar la guía. NUNCA decide cargas. */
export function buildAiPrompt(input: GenerateInput): string {
  const pool = EXERCISES.filter((e) => isEligible(e, input));
  const byPattern = ["hinge", "pull", "push", "core", "squat", "carry"].map(
    (p) => `${p}: ${pool.filter((e) => e.pattern === p).map((e) => e.slug).join(", ") || "(ninguno)"}`
  );
  return `Eres un entrenador de fuerza por salud para una persona que pasa muchas horas sentada y conduciendo.
Formato pedido: ${FORMAT_BY_SLUG[input.format].name_es}. Duración: ${input.prefs.session_minutes} min. Nivel ${input.prefs.level}/3.
Elige entre 4 y 7 ejercicios SOLO de esta lista de slugs (por patrón):
${byPattern.join("\n")}
Reglas: incluye siempre un ejercicio de "hinge" y uno de "core"; al menos tantos de "pull" como de "push"; evita repetir los usados recientemente: ${input.recentSlugs.join(", ") || "ninguno"}.
No indiques pesos, series ni repeticiones.
Responde SOLO con JSON: {"name": "nombre propio breve de la rutina (máx. 30 caracteres, tono ciclista)", "exercises": ["slug", ...], "guidance": "2 frases de guía técnica y motivación, en español, sin consejos médicos"}`;
}

/** Valida la forma de la respuesta de la IA (esquema estricto). Devuelve null si no cumple. */
export function parseAiResponse(text: string): AiPick | null {
  let raw: unknown;
  try {
    raw = JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim());
  } catch {
    return null;
  }
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.name !== "string" || o.name.trim().length === 0 || o.name.length > 40) return null;
  if (typeof o.guidance !== "string" || o.guidance.length > 400) return null;
  if (!Array.isArray(o.exercises) || o.exercises.length < 4 || o.exercises.length > 7) return null;
  if (!o.exercises.every((s) => typeof s === "string")) return null;
  return { name: o.name.trim(), exercises: o.exercises as string[], guidance: o.guidance.trim() };
}

export type ModelCall = (prompt: string) => Promise<string>;

/**
 * Capa IA opcional: el modelo elige slugs/nombre/guía, el motor pone cargas y estructura,
 * y el validador decide. Ante cualquier fallo o respuesta inválida cae al motor de reglas.
 */
export async function generateWithAi(input: GenerateInput, callModel: ModelCall): Promise<GenerateResult & { source: "ai" | "rules" }> {
  const reasons: string[] = [];
  try {
    const pick = parseAiResponse(await callModel(buildAiPrompt(input)));
    if (!pick) throw new Error("respuesta de la IA fuera de esquema");
    const exs = pick.exercises.map((s) => EXERCISE_BY_SLUG[s]);
    if (exs.some((e) => !e)) throw new Error("la IA propuso ejercicios que no existen");
    if (exs.some((e) => !isEligible(e, input))) throw new Error("la IA propuso ejercicios no elegibles");
    const w = { ...generateFromExercises(input, exs, pick.name), guidance: pick.guidance };
    const v = validateWorkout(w, {
      prefs: input.prefs, history: input.history, blocked: blockedAreas(input), nextDayQuality: input.nextDayQuality,
    });
    if (!v.ok) throw new Error(`validador: ${v.errors.join(" ")}`);
    return { workout: w, attempts: [{ attempt: 0, errors: [] }], source: "ai" };
  } catch (e) {
    reasons.push(`IA descartada: ${e instanceof Error ? e.message : "error"}`);
  }
  const rules = generateWorkout(input);
  return { ...rules, attempts: [{ attempt: 0, errors: reasons }, ...rules.attempts], source: "rules" };
}

/** Llamada real a Gemini (JSON). Requiere GEMINI_API_KEY. */
export async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Falta GEMINI_API_KEY");
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${AI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } }),
    }
  );
  if (!res.ok) throw new Error(`Gemini respondió ${res.status}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string") throw new Error("Respuesta de Gemini sin texto");
  return text;
}

/** Interruptor: IA solo si STRENGTH_AI_ENABLED=true y hay clave. Por defecto, apagada. */
export function aiEnabled(): boolean {
  return process.env.STRENGTH_AI_ENABLED === "true" && !!process.env.GEMINI_API_KEY;
}
