import { polar } from "../fk";
import { ANKLE_Y, bonesFor, figure, lerp, rigOf, shoulderOf } from "../figure";
import type { Joints } from "../skeleton";
import { type Implement, type Rig, type Vec } from "../types";

/** PUENTES: puente de glúteo (suelo), a una pierna y hip thrust con la espalda apoyada en un banco. */
export function buildBridge(params: { variant?: "glute_bridge" | "single_leg" | "hip_thrust"; title_es?: string; loop_ms?: number } = {}): Rig {
  const variant = params.variant ?? "glute_bridge";
  const thrust = variant === "hip_thrust";
  // N = punto de apoyo de la espalda alta (fijo). La cadera describe un arco de 70 px alrededor de él.
  const N: Vec = thrust ? [160, 214] : [160, 244];
  const at = (m: number): Joints => {
    const theta = thrust ? lerp(18, -3, m) : -lerp(0, 28, m); // ángulo cadera respecto a N
    const hip = polar(N, theta, 70) as Vec;
    const torso = theta + 180;
    const sh = shoulderOf(hip, torso);
    const j = figure({
      hip,
      torso,
      headTilt: thrust ? 8 : 0,
      ankle: [thrust ? 276 : 290, ANKLE_Y],
      ankleF: variant === "single_leg" ? (polar(hip, -40, 106) as Vec) : undefined,
      footF: -60,
      kneeToward: "up",
      hand: thrust ? [hip[0], hip[1] - 14] : [sh[0] + 64, 246],
      elbowToward: "cw",
    });
    return j;
  };
  const impl: Implement[] = thrust
    ? [{ kind: "bench", offset: [96, 0], size: [104, 28] }, { kind: "dumbbell", at: "hip", offset: [0, -10], angle: 0, size: 18 }]
    : [];
  const title = params.title_es ?? (thrust ? "Hip thrust" : variant === "single_leg" ? "Puente de glúteo a una pierna" : "Puente de glúteo");
  return rigOf({
    id: `bridge_hip_thrust:${variant}`,
    title_es: title,
    loop_ms: params.loop_ms ?? 6000,
    unilateral: variant === "single_leg",
    bones: bonesFor({ farLeg: variant === "single_leg" }),
    at,
    labels: thrust
      ? { start: "Cadera abajo", down: "Sube la cadera", bottom: "Pausa arriba", up: "Baja con control" }
      : { start: "Tumbado, pies planos", down: "Sube empujando con los talones", bottom: "Aprieta glúteos arriba", up: "Baja despacio" },
    implements: impl,
    highlight: { label_es: "Glúteos", segments: [["hip", "knee", 30], ["hip", "back", 22]] },
  });
}
