import { polar } from "../fk";
import { ANKLE_Y, bonesFor, chestPoint, ease, figure, lerp, lerpV, shoulderOf } from "../figure";
import { sampleLoop, squatLikePhases, type Joints } from "../skeleton";
import type { Implement, Rig, Vec } from "../types";

/** Peso muerto con kettlebell: se coge del suelo entre los pies con la espalda larga y se sube empujando el suelo. */
export function buildKettlebellDeadlift(params: { title_es?: string; loop_ms?: number } = {}): Rig {
  const BELL: Vec = [262, 238];
  const at = (m: number): Joints => {
    const hip = lerpV([230, 142], [186, 190], m);
    const torso = lerp(-88, -22, m);
    const sh = shoulderOf(hip, torso);
    const hang: Vec = [sh[0] + 6, sh[1] + 64];
    // Con m=1 la mano está en la kettlebell del suelo; al subir pasa a colgar del hombro.
    const hand = lerpV(hang, BELL, ease(Math.min(1, m * 1.6)));
    return figure({ hip, torso, headTilt: lerp(0, -10, m), ankle: [236, ANKLE_Y], hand });
  };
  return {
    id: "hip_hinge:kettlebell_deadlift",
    title_es: params.title_es ?? "Peso muerto con kettlebell",
    view: "side",
    loop_ms: params.loop_ms ?? 6500,
    bones: bonesFor(),
    interpolation: "linear",
    poses: sampleLoop(at),
    phases: squatLikePhases({ start: "De pie", down: "Cadera atrás y baja", bottom: "Coge la kettlebell", up: "Empuja el suelo y sube" }, [0.2, 0.55, 0.9, 0.7]),
    implements: [{ kind: "kettlebell", at: "wrist", offset: [0, 4] }],
    highlight: { label_es: "Glúteos e isquiotibiales", segments: [["hip", "knee", 34], ["hip", "back", 22]] },
  };
}

/** Buenos días con mancuerna al pecho: bisagra pura, rodillas casi fijas y mancuerna pegada al pecho. */
export function buildGoodMorning(params: { title_es?: string; loop_ms?: number } = {}): Rig {
  const at = (m: number): Joints => {
    const hip: Vec = [226 - 10 * m, 142 + 4 * m];
    const torso = -90 + 70 * m;
    return figure({ hip, torso, headTilt: -6 * m, ankle: [236, ANKLE_Y], hand: chestPoint(hip, torso, 14, 14), elbowToward: "cw" });
  };
  const impl: Implement[] = [{ kind: "dumbbell", at: "wrist", angle: 90, size: 18 }];
  return {
    id: "hip_hinge:good_morning",
    title_es: params.title_es ?? "Buenos días con mancuerna",
    view: "side",
    loop_ms: params.loop_ms ?? 6000,
    bones: bonesFor(),
    interpolation: "linear",
    poses: sampleLoop(at),
    phases: squatLikePhases({ start: "De pie", down: "Cadera atrás", bottom: "Abajo", up: "Sube apretando glúteos" }, [0.15, 0.55, 0.9, 0.6]),
    implements: impl,
    highlight: { label_es: "Isquiotibiales y glúteos", segments: [["hip", "knee", 34], ["hip", "back", 22]] },
  };
}

/** Peso muerto a una pierna: el tronco baja y la pierna libre sube hacia atrás como un balancín. */
export function buildSingleLegDeadlift(params: { title_es?: string; loop_ms?: number } = {}): Rig {
  const at = (m: number): Joints => {
    const torso = lerp(-88, -8, m);
    const ankle: Vec = [240, ANKLE_Y];
    const hip: Vec = [lerp(238, 226, m), 142 + 2 * m];
    const free = polar(hip, torso + 180, 106);
    return figure({ hip, torso, headTilt: lerp(0, -12, m), ankle, ankleF: [lerp(222, free[0], ease(m)), lerp(ANKLE_Y, free[1], ease(m))], footF: lerp(15, 80, m * m), handRel: [4, 64], kneeToward: "forward" });
  };
  return {
    id: "hip_hinge:single_leg",
    title_es: params.title_es ?? "Peso muerto a una pierna",
    view: "side",
    loop_ms: params.loop_ms ?? 7000,
    unilateral: true,
    bones: bonesFor({ farLeg: true }),
    interpolation: "linear",
    poses: sampleLoop(at),
    phases: squatLikePhases({ start: "De pie", down: "Tronco abajo, pierna atrás", bottom: "Cuerpo en línea", up: "Vuelve apretando glúteo" }, [0.15, 0.55, 0.9, 0.6]),
    implements: [{ kind: "dumbbell", at: "wrist", angle: 0, size: 16 }],
    highlight: { label_es: "Glúteos e isquiotibiales", segments: [["hip", "knee", 34], ["hip", "back", 22]] },
  };
}
