import { sampleLoop, squatLikePhases, standingBody, straightArm, STANDING_BONES, type Joints } from "../skeleton";
import type { Implement, Rig } from "../types";
import { buildGoodMorning, buildKettlebellDeadlift, buildSingleLegDeadlift } from "./hinge-variants";

/** Arquetipo BISAGRA DE CADERA (peso muerto rumano / buenos días): la cadera va atrás, las rodillas casi fijas y el tronco se inclina. */
export interface HingeParams {
  /** 0..1: recorrido (1 = tronco casi paralelo al suelo). */
  depth?: number;
  implement?: "none" | "dumbbells" | "barbell";
  /** Variantes con otra geometría (ver hinge-variants.ts). */
  variant?: "kettlebell_deadlift" | "good_morning" | "single_leg";
  /** Flexión de rodilla constante (grados); más alta = peso muerto convencional. */
  kneeBend?: number;
  title_es?: string;
  loop_ms?: number;
}

function hingeJoints(d: number, kneeBend: number): Joints {
  const body = standingBody({
    ankleX: 226,
    shin: 2 + kneeBend * 0.6,
    thigh: 4 + 18 * d + kneeBend * 0.2,
    torso: 72 * d,
    headTilt: -6 * d,
  });
  // Brazos colgando verticales: el peso cae hacia el suelo.
  const arm = straightArm(body.shoulder, 90, 0);
  return { ...body, ...arm };
}

export function buildHinge(params: HingeParams = {}): Rig {
  if (params.variant === "kettlebell_deadlift") return buildKettlebellDeadlift(params);
  if (params.variant === "good_morning") return buildGoodMorning(params);
  if (params.variant === "single_leg") return buildSingleLegDeadlift(params);
  const depth = Math.min(1, Math.max(0.3, params.depth ?? 1));
  const implement = params.implement ?? "none";
  const kneeBend = params.kneeBend ?? 8;
  const impl: Implement[] =
    implement === "dumbbells" ? [{ kind: "dumbbell", at: "wrist", angle: 0, size: 18 }] : implement === "barbell" ? [{ kind: "barbell", at: "wrist" }] : [];
  return {
    id: `hinge:${implement}`,
    title_es: params.title_es ?? "Bisagra de cadera",
    view: "side",
    loop_ms: params.loop_ms ?? 6000,
    bones: STANDING_BONES,
    interpolation: "linear",
    poses: sampleLoop((m) => hingeJoints(m * depth, kneeBend)),
    phases: squatLikePhases({ start: "De pie", down: "Cadera atrás", bottom: "Abajo", up: "Sube" }, [0.15, 0.55, 0.9, 0.6]),
    implements: impl,
    highlight: { label_es: "Glúteos e isquiotibiales", segments: [["hip", "knee", 34], ["hip", "back", 22]] },
  };
}
