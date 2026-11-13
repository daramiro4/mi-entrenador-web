import { ANKLE_Y, bonesFor, figure } from "../figure";
import { sampleLoop, type Joints } from "../skeleton";
import type { Rig, Vec } from "../types";

/** Paseo del granjero: caminar erguido con una carga en cada mano. Dos zancadas por bucle; los pies se mueven y el cuerpo queda en su sitio. */
export function buildCarry(params: { title_es?: string; loop_ms?: number } = {}): Rig {
  const foot = (phase: number): Vec => {
    const p = ((phase % 1) + 1) % 1;
    if (p < 0.55) return [236 + 34 - (68 * p) / 0.55, ANKLE_Y]; // apoyado: el pie va hacia atrás respecto al cuerpo
    const u = (p - 0.55) / 0.45;
    return [236 - 34 + 68 * u, ANKLE_Y - Math.sin(Math.PI * u) * 22]; // vuelo: arco hacia delante
  };
  const at = (t: number): Joints => {
    const c = t * 2;
    const bob = Math.abs(Math.sin(Math.PI * c * 2)) * 0;
    return figure({
      hip: [236, 142 - bob],
      torso: -90,
      ankle: foot(c),
      ankleF: foot(c + 0.5),
      footF: 15,
      handRel: [8, 64],
      handFRel: [8, 64],
    });
  };
  return {
    id: "carry:farmers",
    title_es: params.title_es ?? "Paseo del granjero",
    view: "side",
    loop_ms: params.loop_ms ?? 6000,
    bones: bonesFor({ farLeg: true, farArm: true }),
    interpolation: "linear",
    poses: sampleLoop(at, 96, (t) => t),
    phases: [
      { from: 0, to: 0.25, label_es: "Camina alto", muscle_opacity: 0.5 },
      { from: 0.25, to: 0.5, label_es: "Hombros atrás", muscle_opacity: 0.6 },
      { from: 0.5, to: 0.75, label_es: "Abdomen firme", muscle_opacity: 0.6 },
      { from: 0.75, to: 1, label_es: "Pasos cortos", muscle_opacity: 0.5 },
    ],
    implements: [
      { kind: "dumbbell", at: "wrist", angle: 0, size: 16 },
      { kind: "dumbbell", at: "wrist_f", angle: 0, size: 16 },
    ],
    highlight: { label_es: "Antebrazos y core", segments: [["shoulder", "hip", 24], ["elbow", "wrist", 16]] },
  };
}
