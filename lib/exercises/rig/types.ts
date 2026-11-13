/**
 * Rig de animación de ejercicios (SVG puro, sin librerías). Un rig es un esqueleto 2D de articulaciones NOMBRADAS en un
 * lienzo de 480×300 con el suelo en y=254. Los segmentos (huesos) se dibujan ENTRE articulaciones en cada fotograma, así el
 * escorzo de los movimientos fuera del plano sale de la proyección 2D sin escalar nada: la longitud de un hueso puede cambiar
 * solo si está marcado como `foreshortened` (el validador exige ≤ 8 % en los demás).
 */
export type Vec = [number, number];

export const VIEWBOX = { width: 480, height: 300 } as const;
export const GROUND_Y = 254;
/** Variación máxima permitida de la longitud de un hueso entre poses (salvo escorzo marcado). */
export const MAX_BONE_CHANGE = 0.08;

export type JointName = string;

export interface Pose {
  /** Instante normalizado 0..1 dentro del bucle. */
  t: number;
  /** Posiciones de las articulaciones que cambian en esta pose; las que faltan se heredan (ver normalizePoses). */
  joints: Record<JointName, Vec>;
}

export interface Bone {
  id: string;
  a: JointName;
  b: JointName;
  /** near = lado cercano (trazo principal); far = lado lejano (atenuado); head = círculo en `a` de radio `radius`. */
  side?: "near" | "far";
  kind?: "limb" | "torso" | "head";
  radius?: number;
  /** Resalta el hueso en Ember (p. ej. el brazo que hace el movimiento) para distinguirlo del tronco y la cabeza. */
  accent?: boolean;
  /** Escorzo: este hueso puede acortarse o alargarse más de un 8 % porque el movimiento sale del plano. */
  foreshortened?: boolean;
}

export interface Phase {
  from: number;
  to: number;
  /** Subtítulo de la fase (español). */
  label_es: string;
  /** Texto del paso numerado que se ilumina durante esta fase (opcional: solo si hay técnica verificada). */
  step_es?: string;
  /** Intensidad del resalte del músculo en esta fase (0..1). */
  muscle_opacity?: number;
}

export type ImplementKind = "dumbbell" | "barbell" | "bench" | "band" | "bar" | "kettlebell";

export interface Implement {
  kind: ImplementKind;
  /** Articulación a la que va unido (mancuerna/barra/banda). El banco usa `at` como esquina izquierda sobre el suelo. */
  at?: JointName;
  offset?: Vec;
  /** Banda o barra/línea (pared, barra de dominadas, plataforma): punto fijo o articulación del otro extremo. */
  to?: Vec | JointName;
  /** Banco: [ancho, alto]. Mancuerna: largo de la barra. */
  size?: Vec | number;
  /** Mancuerna: ángulo de la barra en grados (0 = horizontal). */
  angle?: number;
}

export interface Highlight {
  /** Músculo que trabaja, en español. */
  label_es: string;
  /** Cápsulas Volt entre pares de articulaciones: [a, b, grosor]. */
  segments: [JointName, JointName, number][];
}

export interface Rig {
  id: string;
  view: "side" | "front";
  /** Duración del bucle en ms (4000-8000). */
  loop_ms: number;
  /**
   * Cómo se interpola entre poses consecutivas. "eased" (por defecto): suavizado cúbico en cada tramo, para rigs con pocas poses
   * escritas a mano. "linear": lineal, para rigs con muchas poses muestreadas de una cinemática (el suavizado ya va en el muestreo;
   * así los huesos no se acortan a mitad de un giro y no hay paradas entre poses).
   */
  interpolation?: "eased" | "linear";
  bones: Bone[];
  poses: Pose[];
  phases: Phase[];
  implements?: Implement[];
  highlight?: Highlight;
  /** Ejercicio unilateral: el botón de espejo cambia de lado. */
  unilateral?: boolean;
  /** Nombre accesible del ejercicio (español). */
  title_es: string;
  /** Articulaciones que se marcan con un punto Ember (p. ej. el codo que sube): ayudan a leer el movimiento. */
  markers?: JointName[];
  /** Multiplicador del grosor de trazo (figuras ampliadas para llenar el lienzo). Por defecto 1. */
  stroke_scale?: number;
}

export interface RigIssue {
  level: "error" | "warning";
  message: string;
}
