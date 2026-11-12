import type { Rig } from "../types";

/** Los 17 arquetipos previstos (rig base + parámetros). `ready` = implementado; `pending` = falta construir su rig base. */
export const ARCHETYPES = {
  squat: { label_es: "Sentadilla", status: "ready" },
  hip_hinge: { label_es: "Bisagra de cadera", status: "ready" },
  quadruped_rotation: { label_es: "Cuadrupedia con rotación", status: "ready" },
  lunge: { label_es: "Zancada", status: "pending" },
  horizontal_push: { label_es: "Empuje horizontal", status: "pending" },
  vertical_push: { label_es: "Empuje vertical", status: "pending" },
  horizontal_pull: { label_es: "Tirón horizontal", status: "pending" },
  vertical_pull: { label_es: "Tirón vertical", status: "pending" },
  curl: { label_es: "Curl", status: "pending" },
  triceps_extension: { label_es: "Extensión de tríceps", status: "pending" },
  bridge_hip_thrust: { label_es: "Puente / hip thrust", status: "pending" },
  plank_isometric: { label_es: "Plancha / isométrico", status: "pending" },
  lateral_raise: { label_es: "Elevación lateral", status: "pending" },
  crunch: { label_es: "Crunch", status: "pending" },
  carry: { label_es: "Transporte", status: "pending" },
  jump_cardio: { label_es: "Salto / cardio", status: "pending" },
  stretch: { label_es: "Estiramiento", status: "pending" },
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
    default:
      throw new Error(`Arquetipo "${id}" aún no implementado`);
  }
}
