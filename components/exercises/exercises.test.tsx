import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ExerciseAnimation } from "./ExerciseAnimation";
import { ExerciseStaticPoses, peakTime } from "./ExerciseStaticPoses";
import { RigStage } from "./RigStage";
import { buildQuadrupedRotation } from "@/lib/exercises/rig/archetypes/quadruped-rotation";
import { buildSquat } from "@/lib/exercises/rig/archetypes/squat";
import { evalRig } from "@/lib/exercises/rig/interpolate";

describe("RigStage", () => {
  it("dibuja un segmento por hueso, el suelo y los resaltes musculares en Volt (solo tokens, sin hex)", () => {
    const rig = buildSquat({ implement: "goblet" });
    const html = renderToStaticMarkup(<RigStage rig={rig} joints={evalRig(rig, 0.5)} label="Sentadilla goblet" />);
    expect((html.match(/data-bone=/g) ?? []).length).toBe(rig.bones.filter((b) => b.kind !== "head").length);
    expect((html.match(/data-testid="muscle"/g) ?? []).length).toBe(rig.highlight!.segments.length);
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Sentadilla goblet"');
    expect(html).toContain("var(--volt)");
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,6}\b/);
  });

  it("el espejo invierte el eje horizontal", () => {
    const rig = buildQuadrupedRotation();
    const j = evalRig(rig, 0);
    expect(renderToStaticMarkup(<RigStage rig={rig} joints={j} label="x" mirror />)).toContain("scale(-1 1)");
    expect(renderToStaticMarkup(<RigStage rig={rig} joints={j} label="x" />)).not.toContain("scale(-1 1)");
  });

  it("marca el codo con un punto Ember y resalta el brazo que trabaja", () => {
    const rig = buildQuadrupedRotation();
    const html = renderToStaticMarkup(<RigStage rig={rig} joints={evalRig(rig, 0.5)} label="x" />);
    expect(html).toContain('stroke="var(--accent)"');
    expect(html).toContain('fill="var(--accent)"');
  });
});

describe("ExerciseAnimation (estado inicial, sin movimiento)", () => {
  const html = renderToStaticMarkup(<ExerciseAnimation rig={buildQuadrupedRotation()} />);

  it("muestra el subtítulo de la primera fase y el nombre accesible", () => {
    expect(html).toContain("Cuatro apoyos");
    expect(html).toContain("Animación: Rotación torácica");
  });

  it("lista los pasos numerados (los 3 de la ficha) y marca el activo", () => {
    expect(html).toContain("Cómo hacerlo");
    expect((html.match(/aria-current="step"/g) ?? []).length).toBe(1);
    expect(html).toContain("Cuatro apoyos, cadera quieta");
    expect(html).toContain("Sigue el codo con la mirada");
  });

  it("controles accesibles de ≥ 44 px: pausa y cambio de lado (ejercicio unilateral)", () => {
    expect(html).toContain('aria-label="Pausar la animación"');
    expect(html).toContain("Cambiar de lado");
    expect((html.match(/min-h-11 min-w-11/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });

  it("indica el músculo que trabaja", () => {
    expect(html).toContain("Columna torácica");
  });

  it("un ejercicio no unilateral no ofrece el cambio de lado y sin pasos no pinta la lista", () => {
    const squat = renderToStaticMarkup(<ExerciseAnimation rig={buildSquat()} />);
    expect(squat).not.toContain("Cambiar de lado");
    expect(squat).not.toContain("Cómo hacerlo"); // el arquetipo no trae técnica: no se inventa
  });
});

describe("ficha de respaldo (sin animación)", () => {
  it("pose inicial y final estáticas, músculo y dosis; sin texto de técnica", () => {
    const rig = buildSquat({ implement: "goblet" });
    const html = renderToStaticMarkup(<ExerciseStaticPoses rig={rig} dose={{ type: "reps", reps: 10 }} />);
    expect(html).toContain("Inicio");
    expect(html).toContain("Final");
    expect(html).toContain("Cuádriceps y glúteos");
    expect(html).toContain("10 repeticiones");
    expect(html).not.toContain("<ol");
  });

  it("la pose final es el punto más exigente del movimiento", () => {
    const rig = buildSquat();
    const t = peakTime(rig);
    expect(t).toBeGreaterThan(0.4);
    expect(t).toBeLessThan(0.65);
  });

  it("dosis por tiempo", () => {
    const html = renderToStaticMarkup(<ExerciseStaticPoses rig={buildQuadrupedRotation()} dose={{ type: "time", seconds: 40 }} />);
    expect(html).toContain("40 s");
  });
});
