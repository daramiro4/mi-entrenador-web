import { buildArchetype, ARCHETYPES, type ArchetypeId } from "./rig/archetypes";
import type { Rig } from "./rig/types";

/**
 * Mapa ejercicio de Garmin → arquetipo de animación (+ parámetros). Clave: "CATEGORÍA/EJERCICIO".
 * Un ejercicio sin entrada no tiene animación: la ficha cae a las poses estáticas (si hay rig) o solo a los datos.
 * Las entradas se añaden por arquetipo conforme se construye su rig base.
 */
export interface AnimationEntry {
  archetype: ArchetypeId;
  params?: Record<string, unknown>;
}

export const ANIMATION_MAP: Record<string, AnimationEntry> = {
  "WARM_UP/THORACIC_ROTATION": { archetype: "quadruped_rotation" },
  "SQUAT/AIR_SQUAT": { archetype: "squat", params: { implement: "none", title_es: "Sentadilla con peso corporal" } },
  "SQUAT/GOBLET_SQUAT": { archetype: "squat", params: { implement: "goblet", title_es: "Sentadilla goblet" } },
  "SQUAT/BARBELL_BACK_SQUAT": { archetype: "squat", params: { implement: "barbell_back", title_es: "Sentadilla con barra" } },
  "DEADLIFT/ROMANIAN_DEADLIFT": { archetype: "hip_hinge", params: { implement: "dumbbells", kneeBend: 8, title_es: "Peso muerto rumano" } },
  "DEADLIFT/BARBELL_DEADLIFT": { archetype: "hip_hinge", params: { implement: "barbell", kneeBend: 24, title_es: "Peso muerto con barra" } },
  "LUNGE/DUMBBELL_LUNGE": { archetype: "lunge", params: { variant: "forward", title_es: "Zancada" } },
  "LUNGE/DUMBBELL_REVERSE_LUNGE": { archetype: "lunge", params: { variant: "reverse", title_es: "Zancada hacia atrás" } },
  "LUNGE/DUMBBELL_BULGARIAN_SPLIT_SQUAT": { archetype: "lunge", params: { variant: "bulgarian", title_es: "Sentadilla búlgara" } },
  "SQUAT/STEP_UP": { archetype: "step_up", params: { title_es: "Subida al cajón" } },
  "SQUAT/SQUAT": { archetype: "squat", params: { variant: "box", implement: "none", title_es: "Sentadilla a la caja" } },
  "SQUAT/BODY_WEIGHT_WALL_SQUAT": { archetype: "squat", params: { variant: "wall_sit" } },
  "SQUAT/LEG_PRESS": { archetype: "squat", params: { variant: "leg_press" } },
  "CALF_RAISE/STANDING_CALF_RAISE": { archetype: "calf_raise", params: { title_es: "Elevación de talones" } },
  "DEADLIFT/KETTLEBELL_DEADLIFT": { archetype: "hip_hinge", params: { variant: "kettlebell_deadlift" } },
  "LEG_CURL/GOOD_MORNING": { archetype: "hip_hinge", params: { variant: "good_morning" } },
  "DEADLIFT/SINGLE_LEG_ROMANIAN_DEADLIFT_WITH_DUMBBELL": { archetype: "hip_hinge", params: { variant: "single_leg" } },
  "CARRY/FARMERS_CARRY": { archetype: "carry", params: { title_es: "Paseo del granjero" } },
  // Empujes
  "BENCH_PRESS/DUMBBELL_BENCH_PRESS": { archetype: "horizontal_push", params: { variant: "bench_press" } },
  "PUSH_UP/CHEST_PRESS_WITH_BAND": { archetype: "horizontal_push", params: { variant: "band_press" } },
  "PUSH_UP/PUSH_UP": { archetype: "horizontal_push", params: { variant: "pushup" } },
  "PUSH_UP/INCLINE_PUSH_UP": { archetype: "horizontal_push", params: { variant: "incline_pushup", title_es: "Flexiones inclinadas" } },
  "SHOULDER_PRESS/DUMBBELL_SHOULDER_PRESS": { archetype: "vertical_push", params: {} },
  // Tirones
  "ROW/DUMBBELL_ROW": { archetype: "horizontal_pull", params: { variant: "dumbbell_row" } },
  "BANDED_EXERCISES/ROW": { archetype: "horizontal_pull", params: { variant: "band_row" } },
  "ROW/INVERTED_ROW": { archetype: "horizontal_pull", params: { variant: "inverted_row" } },
  "ROW/BANDED_FACE_PULLS": { archetype: "horizontal_pull", params: { variant: "face_pull" } },
  "PULL_UP/LAT_PULLDOWN": { archetype: "vertical_pull", params: { variant: "lat_pulldown" } },
  "PULL_UP/BAND_ASSISTED_PULL_UP": { archetype: "vertical_pull", params: { variant: "pull_up" } },
  "CURL/STANDING_DUMBBELL_BICEPS_CURL": { archetype: "curl", params: {} },
  // Puentes
  "HIP_RAISE/BARBELL_HIP_THRUST_ON_FLOOR": { archetype: "bridge_hip_thrust", params: { variant: "glute_bridge" } },
  "HIP_RAISE/SINGLE_LEG_HIP_RAISE": { archetype: "bridge_hip_thrust", params: { variant: "single_leg" } },
  "HIP_RAISE/BARBELL_HIP_THRUST_WITH_BENCH": { archetype: "bridge_hip_thrust", params: { variant: "hip_thrust" } },
  // Core
  "PLANK/PLANK": { archetype: "plank_isometric", params: {} },
  "HIP_STABILITY/DEAD_BUG": { archetype: "dead_bug", params: {} },
  "HIP_STABILITY/QUADRUPED_WITH_LEG_LIFT": { archetype: "bird_dog", params: {} },
  "HYPEREXTENSION/SUPERMAN_FROM_FLOOR": { archetype: "superman", params: {} },
  "CORE/CABLE_CORE_PRESS": { archetype: "pallof", params: { title_es: "Press Pallof" } },
  // Movilidad
  "WARM_UP/STRETCH_CAT_COW": { archetype: "cat_cow", params: {} },
  "WARM_UP/STRETCH_LUNGING_HIP_FLEXOR": { archetype: "stretch", params: { variant: "hip_flexor" } },
  "WARM_UP/STRETCH_NECK": { archetype: "stretch", params: { variant: "neck_retraction" } },
  "WARM_UP/STRETCH_PECTORAL": { archetype: "stretch", params: { variant: "doorway_chest" } },
};

export const animationKey = (category: string, name: string): string => `${category}/${name}`;
export const hasAnimation = (category: string, name: string): boolean => animationKey(category, name) in ANIMATION_MAP;

/** Rig del ejercicio (carga bajo demanda) o null si no tiene animación. */
export async function loadRigFor(category: string, name: string): Promise<Rig | null> {
  const entry = ANIMATION_MAP[animationKey(category, name)];
  if (!entry || ARCHETYPES[entry.archetype].status !== "ready") return null;
  return buildArchetype(entry.archetype, entry.params);
}
