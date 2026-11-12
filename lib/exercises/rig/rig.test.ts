import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { clamp01, easeInOutCubic, evalPose, evalRig, mirrorJoints, muscleOpacityAt, normalizePoses, phaseIndexAt, timeAt } from "./interpolate";
import { validateRig } from "./validate";
import { angleOf, ik2, polar } from "./fk";
import { buildSquat } from "./archetypes/squat";
import { buildHinge } from "./archetypes/hinge";
import { buildQuadrupedRotation, THORACIC_ROTATION_CUES } from "./archetypes/quadruped-rotation";
import { ARCHETYPES, buildArchetype, READY_ARCHETYPES } from "./archetypes";
import { ANIMATION_MAP, hasAnimation, loadRigFor } from "../animation-map";
import { EXERCISE_BY_SLUG } from "../../strength/library";
import { GROUND_Y, type Pose, type Rig } from "./types";

describe("interpolación", () => {
  it("el suavizado respeta los extremos y es simétrico", () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(1)).toBe(1);
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5, 10);
    expect(easeInOutCubic(0.25) + easeInOutCubic(0.75)).toBeCloseTo(1, 10);
    expect(easeInOutCubic(0.1)).toBeLessThan(0.1); // arranca despacio
  });

  const poses: Pose[] = [
    { t: 0, joints: { a: [0, 0], b: [10, 0] } },
    { t: 0.5, joints: { a: [100, 0] } }, // b no se menciona: hereda
    { t: 1, joints: { a: [0, 0], b: [10, 0] } },
  ];

  it("normalizePoses hereda las articulaciones que faltan", () => {
    const full = normalizePoses(poses);
    expect(full[1].joints.b).toEqual([10, 0]);
  });

  it("en los instantes de las poses devuelve exactamente la pose; antes y después se queda en los extremos", () => {
    expect(evalPose(poses, 0).a).toEqual([0, 0]);
    expect(evalPose(poses, 0.5).a).toEqual([100, 0]);
    expect(evalPose(poses, 1).a).toEqual([0, 0]);
    expect(evalPose(poses, -3).a).toEqual([0, 0]);
    expect(evalPose(poses, 7).a).toEqual([0, 0]);
  });

  it("a mitad de un tramo está en el punto medio (el suavizado es simétrico)", () => {
    expect(evalPose(poses, 0.25).a[0]).toBeCloseTo(50, 8);
    expect(evalPose(poses, 0.75).a[0]).toBeCloseTo(50, 8);
  });

  it("es continua: sin saltos entre fotogramas consecutivos", () => {
    let prev = evalPose(poses, 0).a[0];
    for (let i = 1; i <= 200; i++) {
      const cur = evalPose(poses, i / 200).a[0];
      expect(Math.abs(cur - prev)).toBeLessThan(5);
      prev = cur;
    }
  });

  it("modo lineal: sin suavizado (punto medio del tramo = media de las dos poses y velocidad constante)", () => {
    const two: Pose[] = [{ t: 0, joints: { a: [0, 0] } }, { t: 1, joints: { a: [100, 0] } }];
    expect(evalPose(two, 0.25, "linear").a[0]).toBeCloseTo(25, 8);
    expect(evalPose(two, 0.25, "eased").a[0]).toBeLessThan(10); // el suavizado arranca despacio
  });

  it("timeAt: bucle cíclico y robusto a tiempos negativos", () => {
    expect(timeAt(0, 6000)).toBe(0);
    expect(timeAt(3000, 6000)).toBe(0.5);
    expect(timeAt(6000, 6000)).toBe(0);
    expect(timeAt(9000, 6000)).toBe(0.5);
    expect(timeAt(-1500, 6000)).toBe(0.75);
  });

  it("espejo: refleja x alrededor del eje del lienzo y no toca y", () => {
    expect(mirrorJoints({ a: [100, 50] }).a).toEqual([380, 50]);
    expect(mirrorJoints(mirrorJoints({ a: [100, 50] })).a).toEqual([100, 50]);
  });

  it("clamp01", () => {
    expect(clamp01(-1)).toBe(0);
    expect(clamp01(2)).toBe(1);
  });
});

describe("fases y resalte muscular", () => {
  const phases = [
    { from: 0, to: 0.25, label_es: "A", muscle_opacity: 0 },
    { from: 0.25, to: 0.75, label_es: "B", muscle_opacity: 1 },
    { from: 0.75, to: 1, label_es: "C", muscle_opacity: 0 },
  ];
  it("phaseIndexAt: la fase activa; en t=1 la última", () => {
    expect(phaseIndexAt(phases, 0)).toBe(0);
    expect(phaseIndexAt(phases, 0.25)).toBe(1);
    expect(phaseIndexAt(phases, 0.74)).toBe(1);
    expect(phaseIndexAt(phases, 0.75)).toBe(2);
    expect(phaseIndexAt(phases, 1)).toBe(2);
  });
  it("muscleOpacityAt interpola entre centros de fase, sin saltos", () => {
    expect(muscleOpacityAt(phases, 0.5)).toBe(1);
    expect(muscleOpacityAt(phases, 0.125)).toBe(0);
    // 0.375 está a 2/3 del camino entre los centros 0.125 (opacidad 0) y 0.5 (opacidad 1).
    expect(muscleOpacityAt(phases, 0.375)).toBeCloseTo(2 / 3, 10);
    let prev = muscleOpacityAt(phases, 0);
    for (let i = 1; i <= 100; i++) {
      const cur = muscleOpacityAt(phases, i / 100);
      expect(Math.abs(cur - prev)).toBeLessThan(0.1);
      prev = cur;
    }
  });
});

describe("cinemática (FK/IK)", () => {
  it("polar: -90 apunta arriba, 0 adelante, 90 abajo", () => {
    expect(polar([0, 0], -90, 10)[1]).toBeCloseTo(-10, 8);
    expect(polar([0, 0], 0, 10)[0]).toBeCloseTo(10, 8);
    expect(polar([0, 0], 90, 10)[1]).toBeCloseTo(10, 8);
    expect(angleOf([0, 0], [0, 10])).toBeCloseTo(90, 8);
  });
  it("ik2 conserva las longitudes de los dos huesos cuando el destino es alcanzable", () => {
    const a: [number, number] = [0, 0];
    const c: [number, number] = [40, 30];
    for (const bend of [1, -1] as const) {
      const b = ik2(a, c, 36, 32, bend);
      expect(Math.hypot(b[0] - a[0], b[1] - a[1])).toBeCloseTo(36, 6);
      expect(Math.hypot(c[0] - b[0], c[1] - b[1])).toBeCloseTo(32, 6);
    }
  });
});

describe("validador de rigs", () => {
  const base = (): Rig => ({
    id: "t", title_es: "t", view: "side", loop_ms: 6000,
    bones: [{ id: "b", a: "p", b: "q" }],
    poses: [
      { t: 0, joints: { p: [100, 100], q: [100, 150] } },
      { t: 0.5, joints: { p: [150, 100], q: [150, 150] } }, // se traslada: la longitud no cambia
      { t: 1, joints: { p: [100, 100], q: [100, 150] } },
    ],
    phases: [{ from: 0, to: 1, label_es: "x" }],
  });

  it("un rig con longitudes constantes es válido", () => {
    expect(validateRig(base()).ok).toBe(true);
  });

  it("un hueso que cambia más de un 8 % es un ERROR; marcado como escorzo es solo aviso", () => {
    const r = base();
    r.poses[1].joints.q = [150, 205];
    expect(validateRig(r).ok).toBe(false);
    expect(validateRig(r).issues.some((i) => i.level === "error" && i.message.includes("cambia"))).toBe(true);
    r.bones[0].foreshortened = true;
    const v = validateRig(r);
    expect(v.ok).toBe(true);
    expect(v.issues.some((i) => i.level === "warning" && i.message.includes("escorzo"))).toBe(true);
  });

  it("un cambio de hasta el 8 % se tolera", () => {
    const r = base();
    r.poses[1].joints.q = [150, 100 + 50 * 1.07];
    expect(validateRig(r).ok).toBe(true);
  });

  it("detecta bucle sin cerrar, articulación inexistente, articulaciones fuera del lienzo y fases con huecos", () => {
    const loop = base();
    loop.poses[2].joints.q = [100, 150];
    loop.poses[2].joints.p = [100, 130];
    expect(validateRig(loop).issues.some((i) => i.message.includes("bucle no cierra"))).toBe(true);
    const ghost = base();
    ghost.bones.push({ id: "g", a: "p", b: "zzz" });
    expect(validateRig(ghost).issues.some((i) => i.message.includes("zzz"))).toBe(true);
    const out = base();
    out.poses[1].joints.q = [700, 150];
    out.bones[0].foreshortened = true;
    expect(validateRig(out).issues.some((i) => i.message.includes("fuera del lienzo"))).toBe(true);
    const gap = base();
    gap.phases = [{ from: 0, to: 0.4, label_es: "a" }, { from: 0.5, to: 1, label_es: "b" }];
    expect(validateRig(gap).issues.some((i) => i.message.includes("Hueco o solape"))).toBe(true);
  });

  it("t creciente, primera pose en 0, última en 1 y loop_ms en 4000-8000", () => {
    const r = base();
    r.loop_ms = 2000;
    r.poses[0].t = 0.1;
    const msgs = validateRig(r).issues.map((i) => i.message).join(" | ");
    expect(msgs).toContain("loop_ms");
    expect(msgs).toContain("t=0");
  });

  it("avisa de un hueso bajo el suelo", () => {
    const r = base();
    r.poses[1].joints.p = [150, GROUND_Y + 10];
    r.poses[1].joints.q = [150, GROUND_Y + 30];
    expect(validateRig(r).issues.some((i) => i.level === "warning" && i.message.includes("bajo el suelo"))).toBe(true);
  });
});

describe("rigs incluidos", () => {
  const rigs: [string, () => Rig][] = [
    ["rotación torácica", buildQuadrupedRotation],
    ["sentadilla con peso corporal", () => buildSquat({ implement: "none" })],
    ["sentadilla goblet", () => buildSquat({ implement: "goblet" })],
    ["sentadilla con barra", () => buildSquat({ implement: "barbell_back" })],
    ["sentadilla con mancuernas a los lados", () => buildSquat({ implement: "dumbbells_sides" })],
    ["bisagra con mancuernas", () => buildHinge({ implement: "dumbbells" })],
    ["peso muerto con barra", () => buildHinge({ implement: "barbell", kneeBend: 24 })],
    ["bisagra sin material", () => buildHinge({})],
  ];

  for (const [name, build] of rigs) {
    it(`${name}: pasa el validador sin errores`, () => {
      const v = validateRig(build());
      expect(v.issues.filter((i) => i.level === "error").map((i) => i.message)).toEqual([]);
      expect(v.ok).toBe(true);
    });
  }

  it("sentadilla y bisagra: TODOS los huesos conservan su longitud (≤ 1 %): la animación no deforma el cuerpo", () => {
    for (const build of [() => buildSquat({ implement: "goblet" }), () => buildSquat({ implement: "none" }), () => buildHinge({ implement: "dumbbells" })]) {
      const v = validateRig(build());
      for (const [bone, change] of Object.entries(v.maxBoneChange)) expect(change, bone).toBeLessThan(0.01);
    }
  });

  it("rotación torácica: la cadera NO se mueve y solo el brazo y el antebrazo de trabajo se escorzan", () => {
    const rig = buildQuadrupedRotation();
    const first = evalPose(rig.poses, 0);
    for (let i = 0; i <= 20; i++) {
      const p = evalPose(rig.poses, i / 20);
      for (const fixed of ["hip", "knee", "ankle", "toe", "neck", "back", "shoulder_s", "elbow_s", "wrist_s"]) {
        expect(p[fixed], `${fixed} en t=${i / 20}`).toEqual(first[fixed]);
      }
    }
    const v = validateRig(rig);
    const foreshortened = rig.bones.filter((b) => b.foreshortened).map((b) => b.id).sort();
    expect(foreshortened).toEqual(["forearm", "upper_arm"]);
    for (const [bone, change] of Object.entries(v.maxBoneChange)) {
      if (!foreshortened.includes(bone)) expect(change, bone).toBeLessThan(0.08);
    }
  });

  it("rotación torácica: el codo baja y sube hacia el techo (se eleva por encima del hombro) y la mirada lo sigue", () => {
    const rig = buildQuadrupedRotation();
    const start = evalPose(rig.poses, 0);
    const top = evalPose(rig.poses, 0.55);
    expect(start.elbow_w[1]).toBeGreaterThan(start.shoulder_w[1] + 15); // abajo, por debajo del hombro
    expect(top.elbow_w[1]).toBeLessThan(top.shoulder_w[1] - 20); // arriba, por encima del hombro
    expect(top.head[1]).toBeLessThan(start.head[1] - 8); // la cabeza sube con él
    expect(evalPose(rig.poses, 1).elbow_w).toEqual(start.elbow_w); // vuelve
  });

  it("rotación torácica: el codo no atraviesa la cabeza (se mantiene a distancia del centro de la cabeza)", () => {
    const rig = buildQuadrupedRotation();
    for (let i = 0; i <= 40; i++) {
      const p = evalRig(rig, i / 40);
      const d = Math.hypot(p.elbow_w[0] - p.head[0], p.elbow_w[1] - p.head[1]);
      expect(d, `t=${i / 40}`).toBeGreaterThan(9);
    }
  });

  it("rotación torácica: cuatro fases (inicio, subir, arriba, bajar) con los pasos de la ficha curada", () => {
    const rig = buildQuadrupedRotation();
    expect(rig.phases.map((p) => p.label_es)).toEqual(["Cuatro apoyos", "Abre el codo al techo", "Mira el codo", "Vuelve al inicio"]);
    expect(rig.phases.map((p) => p.step_es).filter(Boolean)).toEqual(EXERCISE_BY_SLUG["rotacion-toracica"].cues_es);
    expect([...THORACIC_ROTATION_CUES]).toEqual(EXERCISE_BY_SLUG["rotacion-toracica"].cues_es);
    expect(rig.unilateral).toBe(true);
  });

  it("los bucles duran entre 4 y 8 s", () => {
    for (const [, build] of rigs) {
      const ms = build().loop_ms;
      expect(ms).toBeGreaterThanOrEqual(4000);
      expect(ms).toBeLessThanOrEqual(8000);
    }
  });

  it("la profundidad cambia el recorrido: más profunda baja más la cadera", () => {
    const shallow = evalPose(buildSquat({ depth: 0.5 }).poses, 0.5).hip[1];
    const deep = evalPose(buildSquat({ depth: 1 }).poses, 0.5).hip[1];
    expect(deep).toBeGreaterThan(shallow);
  });
});

describe("arquetipos y mapa de animaciones", () => {
  it("hay 17 arquetipos previstos y 3 listos", () => {
    expect(Object.keys(ARCHETYPES)).toHaveLength(17);
    expect([...READY_ARCHETYPES].sort()).toEqual(["hip_hinge", "quadruped_rotation", "squat"]);
  });

  it("un arquetipo pendiente falla con un mensaje claro", async () => {
    await expect(buildArchetype("lunge")).rejects.toThrow(/no implementado/);
  });

  it("toda clave del mapa existe en el catálogo de Garmin y apunta a un arquetipo listo", () => {
    const catalog = JSON.parse(readFileSync("data/garmin-exercises.json", "utf8")) as { exercises: { garmin_category: string; garmin_name: string }[] };
    const keys = new Set(catalog.exercises.map((e) => `${e.garmin_category}/${e.garmin_name}`));
    for (const [key, entry] of Object.entries(ANIMATION_MAP)) {
      expect(keys.has(key), key).toBe(true);
      expect(ARCHETYPES[entry.archetype].status, key).toBe("ready");
    }
  });

  it("loadRigFor devuelve un rig válido para cada entrada del mapa y null para un ejercicio sin animación", async () => {
    for (const key of Object.keys(ANIMATION_MAP)) {
      const [category, name] = key.split("/");
      const rig = await loadRigFor(category, name);
      expect(rig, key).not.toBeNull();
      expect(validateRig(rig!).ok, key).toBe(true);
    }
    expect(await loadRigFor("PLANK", "SIDE_PLANK")).toBeNull();
    expect(hasAnimation("WARM_UP", "THORACIC_ROTATION")).toBe(true);
    expect(hasAnimation("PLANK", "SIDE_PLANK")).toBe(false);
  });
});
