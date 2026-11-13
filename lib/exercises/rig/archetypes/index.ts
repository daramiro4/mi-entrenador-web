import type { Rig } from "../types";

/** Los 17 arquetipos previstos (rig base + parámetros). `ready` = implementado; `pending` = falta construir su rig base. */
export const ARCHETYPES = {
  squat: { label_es: "Sentadilla", status: "ready" },
  hip_hinge: { label_es: "Bisagra de cadera", status: "ready" },
  quadruped_rotation: { label_es: "Cuadrupedia con rotación", status: "ready" },
  lunge: { label_es: "Zancada", status: "ready" },
  step_up: { label_es: "Subida al cajón", status: "ready" },
  horizontal_push: { label_es: "Empuje horizontal", status: "ready" },
  vertical_push: { label_es: "Empuje vertical", status: "ready" },
  horizontal_pull: { label_es: "Tirón horizontal", status: "ready" },
  vertical_pull: { label_es: "Tirón vertical", status: "ready" },
  curl: { label_es: "Curl", status: "ready" },
  triceps_extension: { label_es: "Extensión de tríceps", status: "pending" },
  bridge_hip_thrust: { label_es: "Puente / hip thrust", status: "ready" },
  plank_isometric: { label_es: "Plancha / isométrico", status: "ready" },
  lateral_raise: { label_es: "Elevación lateral", status: "pending" },
  crunch: { label_es: "Crunch", status: "pending" },
  carry: { label_es: "Transporte", status: "ready" },
  calf_raise: { label_es: "Elevación de talones", status: "ready" },
  dead_bug: { label_es: "Dead bug", status: "ready" },
  bird_dog: { label_es: "Bird dog", status: "ready" },
  superman: { label_es: "Superman", status: "ready" },
  pallof: { label_es: "Press Pallof", status: "ready" },
  cat_cow: { label_es: "Gato-camello", status: "ready" },
  jump_cardio: { label_es: "Salto / cardio", status: "pending" },
  stretch: { label_es: "Estiramiento", status: "ready" },
} as const;

export type ArchetypeId = keyof typeof ARCHETYPES;
export const READY_ARCHETYPES = (Object.keys(ARCHETYPES) as ArchetypeId[]).filter((id) => ARCHETYPES[id].status === "ready");

/** Carga el rig de un arquetipo BAJO DEMANDA (import dinámico: cada rig es su propio trozo de código, fuera del bundle principal). */
export async function buildArchetype(id: ArchetypeId, params: Record<string, unknown> = {}): Promise<Rig> {
  switch (id) {
    case "squat":
      return (await import("./squat")).buildSquat(params);
    case "hip_hinge":
      return (await import("./hinge")).buildHinge(params);
    case "quadruped_rotation":
      return (await import("./quadruped-rotation")).buildQuadrupedRotation();
    case "lunge":
      return (await import("./lunge")).buildLunge(params);
    case "horizontal_push":
      return buildPush(params);
    case "vertical_push":
      return (await import("./push")).buildShoulderPress(params);
    case "horizontal_pull":
      return buildPullHorizontal(params);
    case "vertical_pull":
      return buildPullVertical(params);
    case "curl":
      return (await import("./pull")).buildCurl(params);
    case "bridge_hip_thrust":
      return (await import("./bridge")).buildBridge(params);
    case "plank_isometric":
      return (await import("./core")).buildPlank(params);
    case "dead_bug":
      return (await import("./core")).buildDeadBug(params);
    case "bird_dog":
      return (await import("./core")).buildBirdDog(params);
    case "superman":
      return (await import("./core")).buildSuperman(params);
    case "pallof":
      return (await import("./push")).buildBandPress({ ...params, pallof: true });
    case "cat_cow":
      return (await import("./mobility")).buildCatCow(params);
    case "stretch":
      return buildStretch(params);
    case "carry":
      return (await import("./carry")).buildCarry(params);
    case "calf_raise":
      return (await import("./squat-variants")).buildCalfRaise(params);
    case "step_up":
      return (await import("./lunge")).buildStepUp(params);
    default:
      throw new Error(`Arquetipo "${id}" aún no implementado`);
  }
}

/** Dentro de cada familia, el parámetro `variant` elige el ejercicio (cada familia es un módulo que se carga bajo demanda). */
async function buildPush(params: Record<string, unknown>): Promise<Rig> {
  const m = await import("./push");
  switch (params.variant ?? "pushup") {
    case "bench_press":
      return m.buildBenchPress(params);
    case "band_press":
      return m.buildBandPress(params);
    case "pushup":
      return m.buildPushUp(params);
    case "incline_pushup":
      return m.buildPushUp({ ...params, handHeight: 60 });
    default:
      throw new Error(`Variante de empuje desconocida: ${String(params.variant)}`);
  }
}

async function buildPullHorizontal(params: Record<string, unknown>): Promise<Rig> {
  const m = await import("./pull");
  switch (params.variant ?? "dumbbell_row") {
    case "dumbbell_row":
      return m.buildDumbbellRow(params);
    case "band_row":
      return m.buildBandRow(params);
    case "inverted_row":
      return m.buildInvertedRow(params);
    case "face_pull":
      return m.buildFacePull(params);
    default:
      throw new Error(`Variante de tirón horizontal desconocida: ${String(params.variant)}`);
  }
}

async function buildPullVertical(params: Record<string, unknown>): Promise<Rig> {
  const m = await import("./pull");
  return params.variant === "pull_up" ? m.buildPullUp(params) : m.buildLatPulldown(params);
}

async function buildStretch(params: Record<string, unknown>): Promise<Rig> {
  const m = await import("./mobility");
  switch (params.variant ?? "hip_flexor") {
    case "hip_flexor":
      return m.buildHipFlexorStretch(params);
    case "neck_retraction":
      return m.buildNeckRetraction(params);
    case "doorway_chest":
      return m.buildDoorwayChestStretch(params);
    default:
      throw new Error(`Variante de estiramiento desconocida: ${String(params.variant)}`);
  }
}
