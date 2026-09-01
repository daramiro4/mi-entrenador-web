import { SESSION_TYPE_LABEL } from "./labels";
import { computeProgressSignal } from "./progress";
import type { PlannedSession } from "./types";

// Mismo modelo/endpoint que usa el resumen motivador diario de
// mi-entrenador-garmin/main.py.
const GEMINI_MODEL = "gemini-3.6-flash";

function listSessionTypes(sessions: PlannedSession[]): string {
  if (sessions.length === 0) return "ninguna";
  return sessions.map((s) => SESSION_TYPE_LABEL[s.session_type]).join(", ");
}

/**
 * Prompt para el resumen de la semana que acaba de cerrar (decisión 7).
 * Solo contextualiza datos que existen de verdad (TSS, sesiones
 * hechas/saltadas/degradadas de ESTA semana) — no menciona una decisión de
 * "sube/repite/inserta" ni patrones entre varias semanas, porque ninguna de
 * las dos cosas se calcula en el motor todavía.
 */
export function buildWeeklyNarrativePrompt(
  sessions: PlannedSession[],
  weekStartDate: string
): string {
  const { targetTss, completedTss, pct } = computeProgressSignal(sessions);
  const done = sessions.filter((s) => s.status === "done");
  const skipped = sessions.filter((s) => s.status === "skipped");
  const degraded = sessions.filter((s) => s.status === "degraded");

  return `
Eres un entrenador personal de ciclismo. Resume brevemente (máximo 120 palabras), en tono motivador, directo y sin lenguaje técnico, cómo fue la semana de entrenamiento que empezó el ${weekStartDate}.

Datos de la semana:
- TSS objetivo: ${targetTss}
- TSS cumplido: ${completedTss}${pct != null ? ` (${Math.round(pct * 100)}%)` : ""}
- Sesiones hechas: ${listSessionTypes(done)}
- Sesiones saltadas: ${listSessionTypes(skipped)}
- Sesiones degradadas por fatiga: ${listSessionTypes(degraded)}

Contextualiza el resultado como si hablaras directamente con la persona, sin repetir los números tal cual. Termina con un emoji.
`.trim();
}

export async function generateWeeklyNarrativeText(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Falta GEMINI_API_KEY");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });

  if (!response.ok) {
    throw new Error(`Gemini respondió ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string") {
    throw new Error(`Respuesta de Gemini sin texto: ${JSON.stringify(data)}`);
  }

  return text.trim();
}
