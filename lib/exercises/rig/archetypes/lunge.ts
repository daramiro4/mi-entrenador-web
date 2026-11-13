import { ANKLE_Y, bonesFor, figure, lerp, lerpV } from "../figure";
import { sampleLoop, squatLikePhases, type Joints } from "../skeleton";
import type { Implement, Rig, Vec } from "../types";

/**
 * Arquetipo ZANCADA (perfil). Tres variantes sobre la misma cinemática inversa: `forward` (da el paso adelante), `reverse` (da el paso
 * atrás) y `bulgarian` (pie trasero sobre un banco). Pierna cercana = delantera, lejana = trasera. Los pies apoyados no se mueven;
 * la cadera baja y la rodilla trasera casi toca el suelo.
 */
export interface LungeParams {
  variant?: "forward" | "reverse" | "bulgarian";
  implement?: "none" | "dumbbells";
  title_es?: string;
  loop_ms?: number;
}

const BENCH_H = 56;

function lungeJoints(m: number, variant: NonNullable<LungeParams["variant"]>): Joints {
  const hangs = { handRel: [9, 64] as Vec, handFRel: [9, 64] as Vec };
  if (variant === "bulgarian") {
    // Pie trasero fijo sobre el banco; la cadera baja en vertical.
    const hip = lerpV([236, 142], [236, 188], m);
    return figure({
      hip,
      torso: -86,
      ankle: [262, ANKLE_Y],
      ankleF: [150, 254 - BENCH_H - 8],
      footF: -35,
      kneeToward: "forward",
      ...hangs,
    });
  }
  // Los dos pies parten juntos; el que da el paso se desplaza dibujando un pequeño arco.
  const arc = Math.sin(Math.PI * m) * 16;
  if (variant === "forward") {
    const hip = lerpV([196, 142], [238, 192], m);
    const front: Vec = [lerp(196, 282, m), ANKLE_Y - arc];
    const back: Vec = [lerp(190, 168, m), lerp(ANKLE_Y, 226, m)];
    return figure({ hip, torso: -86, ankle: front, ankleF: back, footF: lerp(15, 62, m), kneeToward: "forward", ...hangs });
  }
  // reverse: pie delantero fijo, el trasero da el paso atrás
  const hip = lerpV([226, 142], [238, 192], m);
  const stepper: Vec = [lerp(226, 160, m), lerp(ANKLE_Y, 226, m) - arc];
  return figure({ hip, torso: -86, ankle: [282 - (1 - 0) * 0, ANKLE_Y], ankleF: stepper, footF: lerp(15, 62, m), kneeToward: "forward", ...hangs });
}

export function buildLunge(params: LungeParams = {}): Rig {
  const variant = params.variant ?? "forward";
  const implement = params.implement ?? "dumbbells";
  const impl: Implement[] = [];
  if (implement === "dumbbells") impl.push({ kind: "dumbbell", at: "wrist", angle: 0, size: 16 });
  if (variant === "bulgarian") impl.push({ kind: "bench", offset: [110, 0], size: [70, BENCH_H] });
  const labels =
    variant === "forward"
      ? { start: "De pie", down: "Paso adelante y baja", bottom: "Abajo", up: "Empuja y vuelve" }
      : variant === "reverse"
        ? { start: "De pie", down: "Paso atrás y baja", bottom: "Abajo", up: "Empuja y vuelve" }
        : { start: "Arriba", down: "Baja", bottom: "Abajo", up: "Sube" };
  return {
    id: `lunge:${variant}`,
    title_es: params.title_es ?? "Zancada",
    view: "side",
    loop_ms: params.loop_ms ?? 6500,
    unilateral: true,
    bones: bonesFor({ farLeg: true }),
    interpolation: "linear",
    poses: sampleLoop((m) => lungeJoints(m, variant)),
    phases: squatLikePhases(labels, [0.15, 0.55, 0.9, 0.6]),
    implements: impl,
    highlight: { label_es: "Cuádriceps y glúteos", segments: [["hip", "knee", 34], ["hip", "back", 22]] },
  };
}

/** Arquetipo SUBIDA AL CAJÓN (step-up): el pie delantero sobre el cajón empuja hasta ponerse de pie encima; la otra pierna sube y vuelve. */
export interface StepUpParams {
  implement?: "none" | "dumbbells";
  title_es?: string;
  loop_ms?: number;
}

const BOX_H = 30;

function stepUpJoints(m: number): Joints {
  const boxTop = 254 - BOX_H;
  const standY = boxTop - 6;
  // m=0: pie de arriba sobre el cajón y cadera baja; m=1: de pie sobre el cajón con la otra pierna recogida.
  const hip = lerpV([262, 150], [286, standY - 100], m);
  const lifted: Vec = [lerp(222, 300, m), lerp(ANKLE_Y, standY - 40, m) - Math.sin(Math.PI * m) * 6];
  return figure({
    hip,
    torso: -88,
    ankle: [286, standY],
    ankleF: lifted,
    footF: lerp(15, 5, m),
    kneeToward: "forward",
    handRel: [9, 64],
    handFRel: [9, 64],
  });
}

export function buildStepUp(params: StepUpParams = {}): Rig {
  const implement = params.implement ?? "dumbbells";
  return {
    id: "step_up",
    title_es: params.title_es ?? "Subida al cajón",
    view: "side",
    loop_ms: params.loop_ms ?? 6500,
    unilateral: true,
    bones: bonesFor({ farLeg: true }),
    interpolation: "linear",
    poses: sampleLoop((m) => stepUpJoints(m)),
    phases: squatLikePhases({ start: "Pie sobre el cajón", down: "Sube", bottom: "Arriba, de pie", up: "Baja con control" }, [0.15, 0.7, 0.9, 0.5]),
    implements: [{ kind: "bench", offset: [236, 0], size: [110, BOX_H] }, ...(implement === "dumbbells" ? ([{ kind: "dumbbell", at: "wrist", angle: 0, size: 16 }] as Implement[]) : [])],
    highlight: { label_es: "Cuádriceps y glúteos", segments: [["hip", "knee", 34], ["hip", "back", 22]] },
  };
}
