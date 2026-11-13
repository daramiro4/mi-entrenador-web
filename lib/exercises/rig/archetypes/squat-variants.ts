import { ANKLE_Y, bonesFor, chestPoint, figure, lerp, lerpV } from "../figure";
import { holdProfile, sampleLoop, squatLikePhases, type Joints } from "../skeleton";
import { STANDING_BONES } from "../skeleton";
import { GROUND_Y, type Phase, type Rig, type Vec } from "../types";
import { polar } from "../fk";

/** Sentadilla isométrica en la pared: la espalda baja deslizando por la pared hasta los 90° y se mantiene. */
export function buildWallSit(params: { title_es?: string; loop_ms?: number } = {}): Rig {
  const WALL_X = 186;
  const at = (m: number): Joints =>
    figure({
      hip: lerpV([WALL_X + 12, 144], [WALL_X + 12, 194], m),
      torso: -90,
      ankle: [lerp(WALL_X + 18, 256, m), ANKLE_Y],
      handRel: [10, 62],
    });
  return {
    id: "squat:wall_sit",
    title_es: params.title_es ?? "Sentadilla isométrica en la pared",
    view: "side",
    loop_ms: params.loop_ms ?? 7000,
    bones: STANDING_BONES,
    interpolation: "linear",
    poses: sampleLoop(at, 48, holdProfile(0.1, 0.32, 0.78)),
    phases: [
      { from: 0, to: 0.1, label_es: "De pie contra la pared", muscle_opacity: 0.15 },
      { from: 0.1, to: 0.32, label_es: "Baja deslizando", muscle_opacity: 0.6 },
      { from: 0.32, to: 0.78, label_es: "Aguanta a 90°", muscle_opacity: 0.95 },
      { from: 0.78, to: 1, label_es: "Sube", muscle_opacity: 0.5 },
    ] as Phase[],
    implements: [{ kind: "bar", offset: [WALL_X, 20], to: [WALL_X, GROUND_Y] }],
    highlight: { label_es: "Cuádriceps y glúteos", segments: [["hip", "knee", 34], ["hip", "back", 22]] },
  };
}

/** Prensa de piernas (máquina): tumbado con el respaldo inclinado, las piernas empujan una plataforma. */
export function buildLegPress(params: { title_es?: string; loop_ms?: number } = {}): Rig {
  const HIP: Vec = [150, 206];
  const TORSO = -128;
  const at = (m: number): Joints => {
    const ankle: Vec = lerpV([196, 178], [244, 126], m);
    const j = figure({ hip: HIP, torso: TORSO, ankle, foot: -20, kneeToward: "up", hand: [HIP[0] + 16, HIP[1] - 14], elbowToward: "down" });
    // Plataforma perpendicular a la pierna, a la altura de los pies.
    const dir = [j.ankle[0] - HIP[0], j.ankle[1] - HIP[1]];
    const len = Math.hypot(dir[0], dir[1]) || 1;
    const n: Vec = [-dir[1] / len, dir[0] / len];
    const behind = (v: Vec): Vec => [v[0] + 13 * Math.cos((142 * Math.PI) / 180), v[1] + 13 * Math.sin((142 * Math.PI) / 180)];
    return { ...j, back_a: behind(HIP), back_b: behind(j.neck), seat_a: [HIP[0] + 22, HIP[1] + 14], seat_b: [HIP[0] - 22, HIP[1] + 14], plate_a: [j.ankle[0] + 12 * (dir[0] / len) + n[0] * 36, j.ankle[1] + 12 * (dir[1] / len) + n[1] * 36], plate_b: [j.ankle[0] + 12 * (dir[0] / len) - n[0] * 36, j.ankle[1] + 12 * (dir[1] / len) - n[1] * 36] };
  };
  return {
    id: "squat:leg_press",
    title_es: params.title_es ?? "Prensa de piernas",
    view: "side",
    loop_ms: params.loop_ms ?? 6500,
    bones: STANDING_BONES,
    interpolation: "linear",
    poses: sampleLoop(at),
    phases: squatLikePhases({ start: "Rodillas dobladas", down: "Empuja la plataforma", bottom: "Piernas casi estiradas", up: "Vuelve con control" }, [0.2, 0.7, 0.9, 0.5]).map((p) => p),
    implements: [
      { kind: "bar", at: "plate_a", to: "plate_b" },
      { kind: "bar", at: "back_a", to: "back_b" },
      { kind: "bar", at: "seat_a", to: "seat_b" },
    ],
    highlight: { label_es: "Cuádriceps", segments: [["hip", "knee", 34]] },
  };
}

/** Elevación de talones: de pie, el talón sube pivotando sobre la puntera y baja con control. */
export function buildCalfRaise(params: { implement?: "none" | "dumbbells"; title_es?: string; loop_ms?: number } = {}): Rig {
  const TOE_X = 252;
  const at = (m: number): Joints => {
    const th = lerp(15, 64, m);
    const ankle = polar([TOE_X, GROUND_Y], 180 + th, 22.5);
    return figure({ hip: [ankle[0] - 4, ankle[1] - 106], torso: -90, ankle, foot: th, handRel: [10, 62] });
  };
  return {
    id: "calf_raise",
    title_es: params.title_es ?? "Elevación de talones",
    view: "side",
    loop_ms: params.loop_ms ?? 5500,
    bones: STANDING_BONES,
    interpolation: "linear",
    poses: sampleLoop(at, 48, holdProfile(0.1, 0.4, 0.62)),
    phases: [
      { from: 0, to: 0.1, label_es: "Talones abajo", muscle_opacity: 0.15 },
      { from: 0.1, to: 0.4, label_es: "Sube sobre las puntas", muscle_opacity: 0.7 },
      { from: 0.4, to: 0.62, label_es: "Pausa arriba", muscle_opacity: 0.95 },
      { from: 0.62, to: 1, label_es: "Baja despacio", muscle_opacity: 0.4 },
    ],
    implements: params.implement === "none" ? [] : [{ kind: "dumbbell", at: "wrist", angle: 0, size: 16 }],
    highlight: { label_es: "Gemelos", segments: [["knee", "ankle", 30]] },
  };
}

export { chestPoint, bonesFor };
