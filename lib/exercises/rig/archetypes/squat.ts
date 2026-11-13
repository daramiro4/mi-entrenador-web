import { BODY } from "../fk";
import { armTo, sampleLoop, squatLikePhases, standingBody, straightArm, STANDING_BONES, type Joints } from "../skeleton";
import type { Implement, Rig, Vec } from "../types";
import { buildLegPress, buildWallSit } from "./squat-variants";

/** Arquetipo SENTADILLA (vista lateral). La profundidad y el material son parámetros; los huesos conservan su longitud (FK). */
export interface SquatParams {
  /** 0..1: profundidad (1 = muslos paralelos al suelo). */
  depth?: number;
  implement?: "none" | "goblet" | "dumbbells_sides" | "barbell_back";
  /** Variantes con otra geometría (ver squat-variants.ts). `box` = sentadilla a la caja (mismo movimiento, con un cajón detrás). */
  variant?: "box" | "wall_sit" | "leg_press";
  title_es?: string;
  /** Duración del bucle en ms. */
  loop_ms?: number;
}

function squatJoints(d: number, implement: NonNullable<SquatParams["implement"]>): Joints {
  const body = standingBody({
    ankleX: 232,
    shin: 2 + 28 * d,
    thigh: 84 * d,
    torso: 6 + 36 * d,
    headTilt: -4 * d,
  });
  let arm: Pick<Joints, "elbow" | "wrist">;
  if (implement === "goblet") {
    // Mancuerna pegada al pecho: la mano se coloca sobre el pecho y sigue al tronco.
    const dir: Vec = [body.hip[0] - body.neck[0], body.hip[1] - body.neck[1]];
    const len = Math.hypot(dir[0], dir[1]);
    const u: Vec = [dir[0] / len, dir[1] / len];
    const n: Vec = [u[1], -u[0]];
    arm = armTo(body.shoulder, [body.neck[0] + u[0] * 22 + n[0] * 15, body.neck[1] + u[1] * 22 + n[1] * 15]);
  } else if (implement === "barbell_back") {
    arm = armTo(body.shoulder, [body.shoulder[0] - 4, body.shoulder[1] - 2], false);
  } else if (implement === "dumbbells_sides") {
    arm = straightArm(body.shoulder, 90, 0);
  } else {
    // Brazos adelante como contrapeso al bajar.
    arm = straightArm(body.shoulder, 80 - 74 * d, 4);
  }
  return { ...body, ...arm };
}

function implementsFor(implement: NonNullable<SquatParams["implement"]>): Implement[] {
  if (implement === "goblet") return [{ kind: "dumbbell", at: "wrist", angle: 90, size: 20 }];
  if (implement === "dumbbells_sides") return [{ kind: "dumbbell", at: "wrist", angle: 0, size: 18 }];
  if (implement === "barbell_back") return [{ kind: "barbell", at: "shoulder", offset: [-4, -3] }];
  return [];
}

export function buildSquat(params: SquatParams = {}): Rig {
  if (params.variant === "wall_sit" || params.variant === "leg_press") {
    // Import estático ligero: son funciones puras pequeñas; el arquetipo completo sigue cargándose bajo demanda.
    return params.variant === "wall_sit" ? buildWallSit(params) : buildLegPress(params);
  }
  const depth = Math.min(1, Math.max(0.3, params.depth ?? (params.variant === "box" ? 0.95 : 1)));
  const implement = params.implement ?? "none";
  return {
    id: `squat:${implement}`,
    title_es: params.title_es ?? "Sentadilla",
    view: "side",
    loop_ms: params.loop_ms ?? 6000,
    bones: STANDING_BONES,
    interpolation: "linear",
    poses: sampleLoop((m) => squatJoints(m * depth, implement)),
    phases: squatLikePhases(
      params.variant === "box"
        ? { start: "De pie", down: "Cadera atrás hacia la caja", bottom: "Toca la caja", up: "Sube empujando el suelo" }
        : { start: "De pie", down: "Baja", bottom: "Abajo", up: "Sube" },
      [0.15, 0.55, 0.9, 0.6],
    ),
    implements: [...implementsFor(implement), ...(params.variant === "box" ? ([{ kind: "bench", offset: [146, 0], size: [82, 54] }] as Implement[]) : [])],
    highlight: { label_es: "Cuádriceps y glúteos", segments: [["hip", "knee", 34], ["hip", "back", 22]] },
  };
}

export const SQUAT_BODY = BODY;
