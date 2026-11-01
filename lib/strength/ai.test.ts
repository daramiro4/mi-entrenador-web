import { describe, expect, it } from "vitest";
import { generateWithAi, parseAiResponse, buildAiPrompt } from "./ai";
import type { GenerateInput } from "./workout-types";

const input: GenerateInput = {
  prefs: { days_per_week: 2, session_minutes: 30, equipment: ["bodyweight", "dumbbell", "band"], level: 2, limitations: ["low_back"], excluded_areas: [] },
  format: "circuito", history: [], recentDiscomfort: [], recentSlugs: [], recentNames: [], seed: 3,
};
const good = JSON.stringify({ name: "Puerto de primera", exercises: ["puente-gluteo", "remo-banda", "flexiones-inclinadas", "plancha", "sentadilla-goblet"], guidance: "Controla la bajada. Respira." });

describe("capa IA", () => {
  it("el prompt no incluye ejercicios contraindicados ni pide cargas", () => {
    const p = buildAiPrompt(input);
    expect(p).not.toContain("peso-muerto-rumano");
    expect(p).toMatch(/No indiques pesos/);
  });
  it("parsea JSON válido y rechaza esquemas inválidos", () => {
    expect(parseAiResponse(good)?.name).toBe("Puerto de primera");
    expect(parseAiResponse("```json\n" + good + "\n```")).not.toBeNull();
    expect(parseAiResponse("no es json")).toBeNull();
    expect(parseAiResponse(JSON.stringify({ name: "x", exercises: ["a"], guidance: "g" }))).toBeNull();
    expect(parseAiResponse(JSON.stringify({ name: "x".repeat(60), exercises: ["a", "b", "c", "d"], guidance: "g" }))).toBeNull();
  });
  it("usa la selección de la IA si es válida, con cargas del motor", async () => {
    const r = await generateWithAi(input, async () => good);
    expect(r.source).toBe("ai");
    expect(r.workout?.name).toBe("Puerto de primera");
    expect(r.workout?.guidance).toBeTruthy();
    for (const e of r.workout!.blocks[1].exercises) expect(e.weight_kg).toBeNull(); // sin historial: la IA no inventa cargas
  });
  it("cae al motor de reglas si la IA falla, devuelve basura o propone ejercicios inexistentes/no elegibles", async () => {
    const bad = [
      async () => { throw new Error("red caída"); },
      async () => "basura",
      async () => JSON.stringify({ name: "X", exercises: ["inventado", "puente-gluteo", "plancha", "remo-banda"], guidance: "g" }),
      async () => JSON.stringify({ name: "X", exercises: ["peso-muerto-rumano", "puente-gluteo", "plancha", "remo-banda"], guidance: "g" }), // contraindicado (low_back)
    ];
    for (const call of bad) {
      const r = await generateWithAi(input, call);
      expect(r.source).toBe("rules");
      expect(r.workout).not.toBeNull();
      expect(r.attempts[0].errors[0]).toMatch(/IA descartada/);
    }
  });
});
