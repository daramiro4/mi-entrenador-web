/**
 * Enlace entre un ejercicio del módulo de fuerza (slug de lib/strength/library.ts) y su ficha del catálogo
 * (clave "CATEGORÍA/EJERCICIO", la misma de ANIMATION_MAP). Se usa para mostrar la animación nueva en la rutina y en el entreno en vivo.
 * Es una copia mínima de `legacy_slug` de data/garmin-exercises.json (para no cargar el catálogo entero en el navegador);
 * legacy-keys.test.ts comprueba que no se desincroniza.
 */
export const LEGACY_CATALOG_KEY: Record<string, string> = {
  "bird-dog": "HIP_STABILITY/QUADRUPED_WITH_LEG_LIFT",
  "buenos-dias-mancuerna": "LEG_CURL/GOOD_MORNING",
  "curl-biceps": "CURL/STANDING_DUMBBELL_BICEPS_CURL",
  "dead-bug": "HIP_STABILITY/DEAD_BUG",
  "dominadas-asistidas": "PULL_UP/BAND_ASSISTED_PULL_UP",
  "elevacion-talones": "CALF_RAISE/STANDING_CALF_RAISE",
  "estiramiento-pectoral": "WARM_UP/STRETCH_PECTORAL",
  "face-pull-banda": "ROW/BANDED_FACE_PULLS",
  flexiones: "PUSH_UP/PUSH_UP",
  "flexiones-inclinadas": "PUSH_UP/INCLINE_PUSH_UP",
  "flexor-cadera": "WARM_UP/STRETCH_LUNGING_HIP_FLEXOR",
  "gato-camello": "WARM_UP/STRETCH_CAT_COW",
  "hip-thrust": "HIP_RAISE/BARBELL_HIP_THRUST_WITH_BENCH",
  "jalon-pecho": "PULL_UP/LAT_PULLDOWN",
  pallof: "CORE/CABLE_CORE_PRESS",
  "paseo-granjero": "CARRY/FARMERS_CARRY",
  "peso-muerto-barra": "DEADLIFT/BARBELL_DEADLIFT",
  "peso-muerto-kettlebell": "DEADLIFT/KETTLEBELL_DEADLIFT",
  "peso-muerto-rumano": "DEADLIFT/ROMANIAN_DEADLIFT",
  "peso-muerto-una-pierna": "DEADLIFT/SINGLE_LEG_ROMANIAN_DEADLIFT_WITH_DUMBBELL",
  plancha: "PLANK/PLANK",
  "prensa-piernas": "SQUAT/LEG_PRESS",
  "press-banda-pecho": "PUSH_UP/CHEST_PRESS_WITH_BAND",
  "press-hombro-mancuernas": "SHOULDER_PRESS/DUMBBELL_SHOULDER_PRESS",
  "press-mancuernas": "BENCH_PRESS/DUMBBELL_BENCH_PRESS",
  "puente-gluteo": "HIP_RAISE/BARBELL_HIP_THRUST_ON_FLOOR",
  "puente-gluteo-una-pierna": "HIP_RAISE/SINGLE_LEG_HIP_RAISE",
  "remo-banda": "BANDED_EXERCISES/ROW",
  "remo-invertido": "ROW/INVERTED_ROW",
  "remo-mancuerna": "ROW/DUMBBELL_ROW",
  "retraccion-cervical": "WARM_UP/STRETCH_NECK",
  "rotacion-toracica": "WARM_UP/THORACIC_ROTATION",
  "sentadilla-bulgara": "LUNGE/DUMBBELL_BULGARIAN_SPLIT_SQUAT",
  "sentadilla-caja": "SQUAT/SQUAT",
  "sentadilla-goblet": "SQUAT/GOBLET_SQUAT",
  "sentadilla-isometrica-pared": "SQUAT/BODY_WEIGHT_WALL_SQUAT",
  "sentadilla-peso-corporal": "SQUAT/AIR_SQUAT",
  "subida-cajon": "SQUAT/STEP_UP",
  superman: "HYPEREXTENSION/SUPERMAN_FROM_FLOOR",
  zancada: "LUNGE/DUMBBELL_LUNGE",
  "zancada-atras": "LUNGE/DUMBBELL_REVERSE_LUNGE",
};

/** Clave del catálogo de un ejercicio del módulo de fuerza, o null si no tiene ficha. */
export const catalogKeyForSlug = (slug: string): string | null => LEGACY_CATALOG_KEY[slug] ?? null;
