import { buildPosePair, floorBody, type PoseSpec } from "./poses";
import type { Contraindication, Equipment, Exercise, LegLoad, Mode, Pattern } from "./types";

/**
 * Biblioteca inicial de ejercicios (fuente de verdad en código; la tabla
 * `exercises` se siembra desde aquí con scripts/gen-strength-seed.mts).
 * Poses esquemáticas por cinemática directa (ver poses.ts y DECISIONS D10).
 * Los nombres garmin_* son los del catálogo FIT y están SIN VERIFICAR contra
 * Garmin: los comprueba scripts/validate_garmin_mapping.py.
 */

type S = (torso: number, thigh: number, shin: number, arm: number, forearm: number, extra?: Partial<PoseSpec>) => PoseSpec;
const mk =
  (label: string): S =>
  (torso, thigh, shin, arm, forearm, extra = {}) => ({ torso, thigh, shin, arm, forearm, label, ...extra });
const UP = mk("Arriba");
const DOWN = mk("Abajo");
const START = mk("Inicio");
const END = mk("Final");

const STAND = [-90, 93, 87] as const;

interface Def {
  slug: string;
  name_es: string;
  pattern: Pattern;
  equipment: Equipment[];
  level?: 1 | 2 | 3;
  leg_load?: LegLoad;
  contra?: Contraindication[];
  alt: string[];
  cues: string[];
  error: string;
  garmin: [string, string];
  uni?: boolean;
  mode?: Mode;
  a: PoseSpec;
  b: PoseSpec;
}

function def(d: Def): Exercise {
  const [pose_a, pose_b] = buildPosePair(d.a, d.b);
  return {
    slug: d.slug,
    name_es: d.name_es,
    pattern: d.pattern,
    equipment: d.equipment,
    level: d.level ?? 1,
    leg_load: d.leg_load ?? "none",
    contraindications: d.contra ?? [],
    alternatives: d.alt,
    cues_es: d.cues,
    common_error_es: d.error,
    garmin_category: d.garmin[0],
    garmin_exercise: d.garmin[1],
    unilateral: d.uni ?? false,
    mode: d.mode ?? "reps",
    pose_labels: [d.a.label, d.b.label],
    pose_a,
    pose_b,
  };
}

// Cuerpos de suelo (flexiones/plancha) calculados para que manos y pies apoyen.
const pushTop = floorBody(90, 90);
const pushBottom = floorBody(150, 75);
const inclTop = floorBody(90, 90, 24);
const inclBottom = floorBody(150, 75, 24);
const plank = floorBody(90, 0);

export const EXERCISES: Exercise[] = [
  // ---------- Bisagra ----------
  def({ slug: "peso-muerto-rumano", name_es: "Peso muerto rumano con mancuernas", pattern: "hinge", equipment: ["dumbbell", "barbell"], level: 2, leg_load: "heavy", contra: ["low_back"],
    alt: ["buenos-dias-mancuerna", "puente-gluteo"], cues: ["Espalda larga y neutra", "Lleva la cadera atrás como si cerraras un cajón", "Mancuernas pegadas a las piernas"], error: "Redondear la espalda baja al bajar.",
    garmin: ["DEADLIFT", "ROMANIAN_DEADLIFT"], a: UP(...STAND, 104, 94, { eq: "dumbbell" }), b: DOWN(-20, 82, 95, 90, 90, { eq: "dumbbell" }) }),
  def({ slug: "puente-gluteo", name_es: "Puente de glúteo", pattern: "hinge", equipment: ["bodyweight"], leg_load: "light",
    alt: ["hip-thrust", "puente-gluteo-una-pierna"], cues: ["Talones cerca de los glúteos", "Sube empujando con los talones", "Aprieta glúteos arriba, sin arquear la espalda"], error: "Arquear la zona lumbar en vez de extender la cadera.",
    garmin: ["HIP_RAISE", "BARBELL_HIP_THRUST_ON_FLOOR"], a: START(180, -55, 60, 0, 0, { pin: "ankle" }), b: END(163, -12, 72, 0, 0, { pin: "ankle" }) }),
  def({ slug: "hip-thrust", name_es: "Hip thrust con mancuerna", pattern: "hinge", equipment: ["dumbbell", "barbell", "bodyweight"], level: 2, leg_load: "light",
    alt: ["puente-gluteo", "buenos-dias-mancuerna"], cues: ["Parte alta de la espalda apoyada en el banco", "Barbilla hacia el pecho", "Pausa de un segundo arriba"], error: "Subir con la espalda en vez de con los glúteos.",
    garmin: ["HIP_RAISE", "BARBELL_HIP_THRUST_WITH_BENCH"], a: START(205, -38, 72, 20, -10, { eq: "dumbbell" }), b: END(182, -4, 86, 20, -10, { eq: "dumbbell" }) }),
  def({ slug: "buenos-dias-mancuerna", name_es: "Buenos días con mancuerna", pattern: "hinge", equipment: ["dumbbell", "barbell"], level: 2, leg_load: "light", contra: ["low_back"],
    alt: ["peso-muerto-rumano", "puente-gluteo"], cues: ["Mancuerna pegada al pecho", "Cadera atrás, rodillas ligeramente flexionadas", "Sube apretando glúteos"], error: "Doblar la espalda en lugar de la cadera.",
    garmin: ["LEG_CURL", "GOOD_MORNING"], a: UP(...STAND, 70, -140, { eq: "dumbbell" }), b: DOWN(-22, 80, 95, 70, -140, { eq: "dumbbell" }) }),
  def({ slug: "peso-muerto-una-pierna", name_es: "Peso muerto a una pierna", pattern: "hinge", equipment: ["dumbbell", "bodyweight"], level: 3, leg_load: "light", contra: ["low_back"], uni: true,
    alt: ["peso-muerto-rumano", "puente-gluteo-una-pierna"], cues: ["Mira un punto fijo en el suelo", "Cadera cuadrada, sin abrir", "Pierna de apoyo con la rodilla suave"], error: "Rotar la cadera hacia el lado de la pierna libre.",
    garmin: ["DEADLIFT", "DUMBBELL_SINGLE_LEG_DEADLIFT_TO_ROW"], a: UP(...STAND, 104, 94, { eq: "dumbbell" }), b: DOWN(-8, 84, 95, 90, 90, { eq: "dumbbell" }) }),
  def({ slug: "peso-muerto-kettlebell", name_es: "Peso muerto con kettlebell", pattern: "hinge", equipment: ["kettlebell", "dumbbell"], leg_load: "heavy", contra: ["low_back"],
    alt: ["peso-muerto-rumano", "puente-gluteo"], cues: ["Pecho alto, hombros atrás", "Empuja el suelo con los pies", "Cadera y hombros suben a la vez"], error: "Tirar con la espalda y los brazos en lugar de empujar con las piernas.",
    garmin: ["DEADLIFT", "KETTLEBELL_FLOOR_TO_SHELF"], a: UP(...STAND, 104, 94, { eq: "kettlebell" }), b: DOWN(-42, 58, 104, 90, 90, { eq: "kettlebell" }) }),
  def({ slug: "peso-muerto-barra", name_es: "Peso muerto con barra", pattern: "hinge", equipment: ["barbell"], level: 3, leg_load: "heavy", contra: ["low_back"],
    alt: ["peso-muerto-kettlebell", "peso-muerto-rumano"], cues: ["Barra pegada a las espinillas", "Espalda neutra, abdomen firme", "Empuja el suelo y extiende cadera"], error: "Despegar la barra del cuerpo y redondear la espalda.",
    garmin: ["DEADLIFT", "BARBELL_DEADLIFT"], a: UP(...STAND, 104, 94, { eq: "barbell" }), b: DOWN(-38, 55, 106, 90, 90, { eq: "barbell" }) }),
  def({ slug: "puente-gluteo-una-pierna", name_es: "Puente de glúteo a una pierna", pattern: "hinge", equipment: ["bodyweight"], level: 2, leg_load: "light", uni: true,
    alt: ["puente-gluteo"], cues: ["Cadera nivelada", "Empuja con el talón de apoyo", "Sube sin arquear la espalda"], error: "Dejar caer la cadera del lado de la pierna libre.",
    garmin: ["HIP_RAISE", "SINGLE_LEG_HIP_RAISE"], a: START(180, -55, 60, 0, 0), b: END(163, -12, 72, 0, 0) }),

  // ---------- Sentadilla / zancada ----------
  def({ slug: "sentadilla-goblet", name_es: "Sentadilla goblet", pattern: "squat", equipment: ["dumbbell", "kettlebell"], leg_load: "heavy", contra: ["knee"],
    alt: ["sentadilla-peso-corporal", "sentadilla-caja"], cues: ["Mancuerna pegada al pecho", "Rodillas siguen la línea de los pies", "Pecho alto durante todo el recorrido"], error: "Que las rodillas se cierren hacia dentro al subir.",
    garmin: ["SQUAT", "GOBLET_SQUAT"], a: UP(...STAND, 70, -140, { eq: "dumbbell" }), b: DOWN(-62, 24, 116, 70, -140, { eq: "dumbbell" }) }),
  def({ slug: "sentadilla-peso-corporal", name_es: "Sentadilla con peso corporal", pattern: "squat", equipment: ["bodyweight"], leg_load: "light", contra: ["knee"],
    alt: ["sentadilla-caja", "sentadilla-goblet"], cues: ["Pies al ancho de hombros", "Baja como si te sentaras", "Pecho alto, talones apoyados"], error: "Levantar los talones del suelo.",
    garmin: ["SQUAT", "AIR_SQUAT"], a: UP(...STAND, 104, 94), b: DOWN(-62, 24, 116, 0, 0) }),
  def({ slug: "sentadilla-caja", name_es: "Sentadilla a la caja", pattern: "squat", equipment: ["bodyweight", "dumbbell"], leg_load: "light", contra: ["knee"],
    alt: ["sentadilla-peso-corporal"], cues: ["Toca la caja con los glúteos sin dejarte caer", "Cadera atrás primero", "Sube empujando el suelo"], error: "Dejarse caer sobre la caja.",
    garmin: ["SQUAT", "SQUAT"], a: UP(...STAND, 70, -140, { eq: "dumbbell" }), b: DOWN(-58, 12, 98, 70, -140, { eq: "dumbbell" }) }),
  def({ slug: "zancada", name_es: "Zancada", pattern: "squat", equipment: ["bodyweight", "dumbbell"], level: 2, leg_load: "heavy", contra: ["knee"], uni: true,
    alt: ["zancada-atras", "subida-cajon"], cues: ["Paso largo, torso erguido", "Rodilla delantera sobre el tobillo", "Empuja con el talón delantero"], error: "Rodilla delantera que se va hacia dentro o muy adelante del pie.",
    garmin: ["LUNGE", "DUMBBELL_LUNGE"], a: UP(...STAND, 104, 94, { eq: "dumbbell" }), b: DOWN(-86, 8, 100, 90, 90, { eq: "dumbbell" }) }),
  def({ slug: "zancada-atras", name_es: "Zancada hacia atrás", pattern: "squat", equipment: ["bodyweight", "dumbbell"], level: 1, leg_load: "heavy", contra: ["knee"], uni: true,
    alt: ["zancada", "subida-cajon"], cues: ["Da el paso atrás con control", "Torso erguido", "Vuelve empujando con la pierna delantera"], error: "Inclinar el torso hacia delante.",
    garmin: ["LUNGE", "DUMBBELL_REVERSE_LUNGE"], a: UP(...STAND, 104, 94, { eq: "dumbbell" }), b: DOWN(-88, 18, 96, 90, 90, { eq: "dumbbell" }) }),
  def({ slug: "sentadilla-bulgara", name_es: "Sentadilla búlgara", pattern: "squat", equipment: ["dumbbell", "bodyweight"], level: 3, leg_load: "heavy", contra: ["knee"], uni: true,
    alt: ["zancada", "subida-cajon"], cues: ["Pie trasero apoyado en el banco", "Baja vertical, sin adelantar la rodilla", "Peso en el talón delantero"], error: "Apoyar el peso en la pierna de atrás.",
    garmin: ["LUNGE", "DUMBBELL_BULGARIAN_SPLIT_SQUAT"], a: UP(-88, 62, 92, 90, 90, { eq: "dumbbell" }), b: DOWN(-80, 20, 100, 90, 90, { eq: "dumbbell" }) }),
  def({ slug: "subida-cajon", name_es: "Subida al cajón", pattern: "squat", equipment: ["bodyweight", "dumbbell"], leg_load: "heavy", contra: ["knee"], uni: true,
    alt: ["zancada-atras", "sentadilla-caja"], cues: ["Todo el pie sobre el cajón", "Sube con la pierna de arriba, sin impulso", "Baja con control"], error: "Impulsarse con el pie de abajo.",
    garmin: ["SQUAT", "STEP_UP"], a: START(-84, 14, 92, 90, 90, { eq: "dumbbell" }), b: END(...STAND, 104, 94, { eq: "dumbbell" }) }),
  def({ slug: "prensa-piernas", name_es: "Prensa de piernas", pattern: "squat", equipment: ["machine"], leg_load: "heavy", contra: ["knee"],
    alt: ["sentadilla-caja", "sentadilla-goblet"], cues: ["Espalda y cabeza apoyadas", "No bloquees las rodillas arriba", "Baja hasta unos 90° de rodilla"], error: "Despegar la cadera del respaldo al bajar.",
    garmin: ["SQUAT", "LEG_PRESS"], a: START(-140, -28, -28, -20, -60, { pin: "hip" }), b: END(-140, -62, 38, -20, -60, { pin: "hip" }) }),
  def({ slug: "elevacion-talones", name_es: "Elevación de talones", pattern: "squat", equipment: ["bodyweight", "dumbbell"], leg_load: "light",
    alt: ["sentadilla-peso-corporal"], cues: ["Sube lo más alto posible", "Pausa arriba un segundo", "Baja despacio"], error: "Rebotar abajo sin controlar el descenso.",
    garmin: ["CALF_RAISE", "STANDING_CALF_RAISE"], a: UP(...STAND, 104, 94, { eq: "dumbbell" }), b: DOWN(-90, 90, 98, 90, 90, { eq: "dumbbell", dy: -8 }) }),
  def({ slug: "sentadilla-isometrica-pared", name_es: "Sentadilla isométrica en la pared", pattern: "squat", equipment: ["bodyweight"], leg_load: "light", contra: ["knee"], mode: "time",
    alt: ["sentadilla-peso-corporal"], cues: ["Espalda plana contra la pared", "Rodillas a unos 90°", "Respira con calma"], error: "Dejar que las rodillas pasen por delante de los pies.",
    garmin: ["SQUAT", "BODY_WEIGHT_WALL_SQUAT"], a: START(...STAND, 104, 94), b: END(-90, 0, 90, 90, 90) }),

  // ---------- Empuje ----------
  def({ slug: "flexiones", name_es: "Flexiones", pattern: "push", equipment: ["bodyweight"], level: 2, contra: ["wrist", "shoulder"],
    alt: ["flexiones-inclinadas", "press-mancuernas"], cues: ["Cuerpo en línea recta de cabeza a talones", "Codos a unos 45° del tronco", "Baja el pecho hasta casi tocar el suelo"], error: "Dejar caer la cadera o llevar los codos abiertos.",
    garmin: ["PUSH_UP", "PUSH_UP"], a: UP(pushTop.torso, pushTop.thigh, pushTop.shin, pushTop.arm, pushTop.forearm), b: DOWN(pushBottom.torso, pushBottom.thigh, pushBottom.shin, pushBottom.arm, pushBottom.forearm) }),
  def({ slug: "flexiones-inclinadas", name_es: "Flexiones inclinadas", pattern: "push", equipment: ["bodyweight"], contra: ["wrist", "shoulder"],
    alt: ["press-mancuernas", "press-banda-pecho"], cues: ["Manos en banco o pared firme", "Cuerpo recto", "Pecho hacia el apoyo"], error: "Encoger los hombros hacia las orejas.",
    garmin: ["PUSH_UP", "INCLINE_PUSH_UP"], a: UP(inclTop.torso, inclTop.thigh, inclTop.shin, inclTop.arm, inclTop.forearm), b: DOWN(inclBottom.torso, inclBottom.thigh, inclBottom.shin, inclBottom.arm, inclBottom.forearm) }),
  def({ slug: "press-mancuernas", name_es: "Press de pecho con mancuernas", pattern: "push", equipment: ["dumbbell"], level: 2, contra: ["shoulder"],
    alt: ["flexiones-inclinadas", "press-banda-pecho"], cues: ["Omóplatos atrás y abajo", "Codos a unos 45°", "Empuja las mancuernas hacia el techo"], error: "Abrir los codos a 90° con el torso.",
    garmin: ["BENCH_PRESS", "DUMBBELL_BENCH_PRESS"], a: UP(180, -58, 60, -90, -90, { pin: "ankle", eq: "dumbbell" }), b: DOWN(180, -58, 60, 100, -90, { pin: "ankle", eq: "dumbbell" }) }),
  def({ slug: "press-hombro-mancuernas", name_es: "Press de hombro con mancuernas", pattern: "push", equipment: ["dumbbell"], level: 2, contra: ["shoulder", "neck"],
    alt: ["press-banda-pecho", "flexiones-inclinadas"], cues: ["Abdomen firme, costillas abajo", "Empuja en vertical", "Brazos cerca de las orejas arriba"], error: "Arquear la espalda baja al empujar.",
    garmin: ["SHOULDER_PRESS", "DUMBBELL_SHOULDER_PRESS"], a: START(...STAND, 100, -90, { eq: "dumbbell" }), b: END(...STAND, -90, -90, { eq: "dumbbell" }) }),
  def({ slug: "press-banda-pecho", name_es: "Press de pecho con banda", pattern: "push", equipment: ["band"], contra: ["shoulder"],
    alt: ["flexiones-inclinadas"], cues: ["Banda anclada a la espalda", "Empuja al frente con el pecho", "Vuelve con control"], error: "Perder la tensión de la banda al volver.",
    garmin: ["PUSH_UP", "CHEST_PRESS_WITH_BAND"], a: START(...STAND, 150, 30, { eq: "band", anchor: [-48, 0] }), b: END(...STAND, 0, 0, { eq: "band", anchor: [-48, 0] }) }),

  // ---------- Tirón ----------
  def({ slug: "remo-mancuerna", name_es: "Remo con mancuerna", pattern: "pull", equipment: ["dumbbell"], leg_load: "none", contra: ["low_back"], uni: true,
    alt: ["remo-banda", "jalon-pecho"], cues: ["Espalda plana y paralela al suelo", "Tira del codo hacia la cadera", "Aprieta la escápula arriba"], error: "Girar el tronco para ayudarse a subir.",
    garmin: ["ROW", "DUMBBELL_ROW"], a: START(-22, 82, 95, 90, 90, { eq: "dumbbell" }), b: END(-22, 82, 95, 156, 100, { eq: "dumbbell" }) }),
  def({ slug: "remo-banda", name_es: "Remo con banda", pattern: "pull", equipment: ["band"],
    alt: ["remo-mancuerna", "face-pull-banda"], cues: ["Pecho alto, hombros abajo", "Lleva los codos atrás pegados al cuerpo", "Junta las escápulas"], error: "Encoger los hombros al tirar.",
    garmin: ["ROW", "SEATED_CABLE_ROW"], a: START(...STAND, 0, 0, { eq: "band", anchor: [52, 0] }), b: END(...STAND, 160, 14, { eq: "band", anchor: [52, 0] }) }),
  def({ slug: "remo-invertido", name_es: "Remo invertido bajo una mesa", pattern: "pull", equipment: ["bodyweight"], level: 2, contra: ["elbow", "shoulder"],
    alt: ["remo-banda", "remo-mancuerna"], cues: ["Agárrate al borde de una mesa estable", "Cuerpo recto, glúteos firmes", "Lleva el pecho al borde juntando las escápulas"], error: "Dejar caer la cadera y tirar solo con los brazos.",
    garmin: ["ROW", "INVERTED_ROW"], a: START(-32, 148, 148, -90, -90, { pin: "wrist", eq: "barbell" }), b: END(-50, 130, 130, 125, -65, { pin: "wrist", eq: "barbell" }) }),
  def({ slug: "jalon-pecho", name_es: "Jalón al pecho", pattern: "pull", equipment: ["cable", "machine"], level: 2,
    alt: ["dominadas-asistidas", "remo-banda"], cues: ["Pecho alto", "Tira de los codos hacia las costillas", "Baja la barra a la clavícula"], error: "Tirar de la barra tras la nuca o balancear el tronco.",
    garmin: ["PULL_UP", "LAT_PULLDOWN"], a: START(-95, 0, 90, -78, -88, { pin: "hip", eq: "barbell" }), b: END(-95, 0, 90, 100, -70, { pin: "hip", eq: "barbell" }) }),
  def({ slug: "dominadas-asistidas", name_es: "Dominadas asistidas", pattern: "pull", equipment: ["machine", "band"], level: 3, contra: ["shoulder", "elbow"],
    alt: ["jalon-pecho", "remo-banda"], cues: ["Empieza con los hombros activados", "Lleva el pecho hacia la barra", "Baja despacio hasta estirar los brazos"], error: "Balancearse y no bajar del todo.",
    garmin: ["PULL_UP", "BAND_ASSISTED_PULL_UP"], a: START(-90, 90, 100, -90, -90, { pin: "wrist", eq: "barbell" }), b: END(-90, 90, 100, 104, -76, { pin: "wrist", eq: "barbell" }) }),
  def({ slug: "face-pull-banda", name_es: "Face pull con banda", pattern: "pull", equipment: ["band", "cable"], contra: ["shoulder"],
    alt: ["remo-banda"], cues: ["Banda a la altura de la cara", "Abre los codos altos hacia fuera", "Rota los puños hacia atrás"], error: "Tirar con los brazos sin abrir los hombros.",
    garmin: ["ROW", "BANDED_FACE_PULLS"], a: START(...STAND, 0, 0, { eq: "band", anchor: [52, -4] }), b: END(...STAND, 172, -8, { eq: "band", anchor: [52, -4] }) }),
  def({ slug: "curl-biceps", name_es: "Curl de bíceps con mancuernas", pattern: "pull", equipment: ["dumbbell", "band"], contra: ["elbow", "wrist"],
    alt: ["remo-mancuerna"], cues: ["Codos pegados al cuerpo", "Sube sin balancear", "Baja despacio"], error: "Balancear el cuerpo para subir el peso.",
    garmin: ["CURL", "STANDING_DUMBBELL_BICEPS_CURL"], a: UP(...STAND, 104, 94, { eq: "dumbbell" }), b: DOWN(...STAND, 90, -112, { eq: "dumbbell" }) }),

  // ---------- Core y acarreo ----------
  def({ slug: "dead-bug", name_es: "Dead bug", pattern: "core", equipment: ["bodyweight"], uni: true,
    alt: ["plancha", "bird-dog"], cues: ["Lumbar pegada al suelo", "Extiende brazo y pierna contrarios despacio", "Respira sin perder la posición"], error: "Arquear la zona lumbar al estirar.",
    garmin: ["HIP_STABILITY", "DEAD_BUG"], a: START(180, -90, 0, -90, -90, { pin: "hip" }), b: END(180, 0, 0, 200, 200, { pin: "hip" }) }),
  def({ slug: "plancha", name_es: "Plancha", pattern: "core", equipment: ["bodyweight"], mode: "time", contra: ["shoulder", "wrist"],
    alt: ["dead-bug", "bird-dog"], cues: ["Codos bajo los hombros", "Cuerpo recto, glúteos firmes", "Empuja el suelo con los antebrazos"], error: "Hundir la cadera o subirla en forma de pico.",
    garmin: ["PLANK", "PLANK"], a: START(plank.torso, plank.thigh, plank.shin, plank.arm, plank.forearm), b: END(plank.torso + 2, plank.thigh + 2, plank.shin + 2, plank.arm, plank.forearm) }),
  def({ slug: "pallof", name_es: "Press Pallof", pattern: "core", equipment: ["band", "cable"], uni: true,
    alt: ["plancha", "dead-bug"], cues: ["Banda a la altura del pecho, de lado", "Estira los brazos sin girar el tronco", "Aguanta un segundo extendido"], error: "Dejar que la banda te gire el torso.",
    garmin: ["CORE", "CABLE_CORE_PRESS"], a: START(...STAND, 70, -110, { eq: "band", anchor: [-40, 0] }), b: END(...STAND, 0, 0, { eq: "band", anchor: [-40, 0] }) }),
  def({ slug: "bird-dog", name_es: "Bird dog", pattern: "core", equipment: ["bodyweight"], uni: true, contra: ["wrist"],
    alt: ["dead-bug", "plancha"], cues: ["Espalda plana como una mesa", "Estira brazo y pierna contrarios", "Cadera quieta, sin girar"], error: "Girar la cadera al elevar la pierna.",
    garmin: ["HIP_STABILITY", "QUADRUPED_WITH_LEG_LIFT"], a: START(-6, 90, 180, 90, 90, { pin: "hip" }), b: END(-6, 176, 205, -30, -30, { pin: "hip" }) }),
  def({ slug: "superman", name_es: "Superman", pattern: "core", equipment: ["bodyweight"], contra: ["low_back", "neck"],
    alt: ["bird-dog"], cues: ["Mira al suelo, cuello largo", "Eleva brazos y piernas sin forzar", "Mantén un segundo arriba"], error: "Levantar la cabeza y arquear en exceso la zona lumbar.",
    garmin: ["HYPEREXTENSION", "SUPERMAN_FROM_FLOOR"], a: START(0, 180, 180, 180, 180, { pin: "hip" }), b: END(-12, 192, 192, 190, 190, { pin: "hip" }) }),
  def({ slug: "paseo-granjero", name_es: "Paseo del granjero", pattern: "carry", equipment: ["dumbbell", "kettlebell"], mode: "time", leg_load: "light",
    alt: ["plancha", "pallof"], cues: ["Camina alto, hombros atrás", "Abdomen firme", "Pasos cortos y controlados"], error: "Inclinarse hacia un lado o encoger los hombros.",
    garmin: ["CARRY", "FARMERS_CARRY"], a: START(...STAND, 104, 94, { eq: "dumbbell" }), b: END(-90, 70, 108, 90, 90, { eq: "dumbbell" }) }),

  // ---------- Movilidad (calentamiento y antídoto de conducción) ----------
  def({ slug: "flexor-cadera", name_es: "Estiramiento de flexor de cadera", pattern: "mobility", equipment: ["bodyweight"], mode: "time", uni: true,
    alt: ["gato-camello"], cues: ["Rodilla trasera en el suelo", "Mete la pelvis hacia delante", "Torso erguido, respira lento"], error: "Arquear la espalda baja en lugar de empujar la cadera.",
    garmin: ["WARM_UP", "STRETCH_LUNGING_HIP_FLEXOR"], a: START(-90, 100, 178, 90, 90, { pin: "knee" }), b: END(-96, 118, 178, 90, 90, { pin: "knee" }) }),
  def({ slug: "rotacion-toracica", name_es: "Rotación torácica", pattern: "mobility", equipment: ["bodyweight"], mode: "time", uni: true,
    alt: ["gato-camello"], cues: ["Cuatro apoyos, cadera quieta", "Mano tras la cabeza y abre el codo al techo", "Sigue el codo con la mirada"], error: "Mover la cadera en vez de rotar el tronco.",
    garmin: ["WARM_UP", "THORACIC_ROTATION"], a: START(-8, 90, 180, 90, 90, { pin: "wrist" }), b: END(-38, 90, 180, -90, -90, { pin: "wrist" }) }),
  def({ slug: "estiramiento-pectoral", name_es: "Estiramiento de pectoral en puerta", pattern: "mobility", equipment: ["bodyweight"], mode: "time", contra: ["shoulder"],
    alt: ["rotacion-toracica"], cues: ["Antebrazos apoyados en el marco", "Da un paso al frente despacio", "Notarás el estiramiento en el pecho, no en el hombro"], error: "Forzar hasta sentir pinchazo en el hombro.",
    garmin: ["WARM_UP", "STRETCH_PECTORAL"], a: START(...STAND, 0, -90), b: END(-80, 84, 90, 0, -90, { pin: "ankle" }) }),
  def({ slug: "retraccion-cervical", name_es: "Retracción cervical (cuello)", pattern: "mobility", equipment: ["bodyweight"], mode: "time", contra: ["neck"],
    alt: ["rotacion-toracica"], cues: ["Mira al frente", "Mete la barbilla como haciendo papada", "Sin inclinar la cabeza"], error: "Bajar la cabeza en vez de retraer el cuello.",
    garmin: ["WARM_UP", "STRETCH_NECK"], a: START(...STAND, 104, 94, { neck: -62 }), b: END(...STAND, 104, 94, { neck: -90 }) }),
  def({ slug: "gato-camello", name_es: "Gato-camello", pattern: "mobility", equipment: ["bodyweight"], mode: "time", contra: ["wrist"],
    alt: ["rotacion-toracica", "flexor-cadera"], cues: ["Cuatro apoyos", "Redondea y arquea la espalda despacio", "Sigue la respiración"], error: "Moverse rápido, sin segmentar la columna.",
    garmin: ["WARM_UP", "STRETCH_CAT_COW"], a: START(-14, 90, 180, 90, 90, { pin: "wrist", neck: -44 }), b: END(8, 90, 180, 90, 90, { pin: "wrist", neck: 56 }) }),
];

export const EXERCISE_BY_SLUG: Record<string, Exercise> = Object.fromEntries(EXERCISES.map((e) => [e.slug, e]));
