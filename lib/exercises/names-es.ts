/**
 * Nombres en español, DETERMINISTAS y conservadores. Regla de oro: si no hay certeza, se deja el inglés (estado "en");
 * jamás se inventa. Un nombre se traduce solo si, tras quitar modificadores conocidos (material, lateralidad, "con peso"),
 * lo que queda es EXACTAMENTE una frase de movimiento del diccionario. Todo lo demás queda para revisión manual en
 * data/exercise-names-es.csv (las filas con estado "reviewed" ahí mandan sobre este diccionario).
 */

export const CATEGORY_ES: Record<string, string> = {
  BANDED_EXERCISES: "Ejercicios con banda",
  BATTLE_ROPE: "Cuerdas de batalla",
  BENCH_PRESS: "Press de banca",
  BIKE_OUTDOOR: "Bicicleta exterior",
  CALF_RAISE: "Elevación de gemelos",
  CARDIO: "Cardio",
  CARRY: "Transportes",
  CHOP: "Leñadores",
  CORE: "Core",
  CRUNCH: "Crunch",
  CURL: "Curl de bíceps",
  DEADLIFT: "Peso muerto",
  ELLIPTICAL: "Elíptica",
  FLOOR_CLIMB: "Escalada en suelo",
  FLYE: "Aperturas",
  HIP_RAISE: "Elevación de cadera",
  HIP_STABILITY: "Estabilidad de cadera",
  HIP_SWING: "Balanceo de cadera",
  HYPEREXTENSION: "Hiperextensión",
  INDOOR_BIKE: "Bicicleta estática",
  LADDER: "Escalera de agilidad",
  LATERAL_RAISE: "Elevación lateral",
  LEG_CURL: "Curl de pierna",
  LEG_RAISE: "Elevación de piernas",
  LUNGE: "Zancada",
  OLYMPIC_LIFT: "Levantamiento olímpico",
  PLANK: "Plancha",
  PLYO: "Pliométricos",
  PULL_UP: "Dominadas",
  PUSH_UP: "Flexiones",
  ROW: "Remo",
  RUN: "Carrera",
  RUN_INDOOR: "Carrera en cinta",
  SANDBAG: "Saco de arena",
  SHOULDER_PRESS: "Press de hombros",
  SHOULDER_STABILITY: "Estabilidad de hombro",
  SHRUG: "Encogimientos",
  SIT_UP: "Abdominales (sit-up)",
  SLED: "Trineo",
  SLEDGE_HAMMER: "Mazo",
  SQUAT: "Sentadilla",
  STAIR_STEPPER: "Escaladora",
  SUSPENSION: "Suspensión",
  TIRE: "Neumático",
  TOTAL_BODY: "Cuerpo completo",
  TRICEPS_EXTENSION: "Extensión de tríceps",
  WARM_UP: "Calentamiento",
};

/** Frases de movimiento (inglés en minúsculas → español). Sin modificadores de material/lateralidad. */
export const MOVES: Record<string, string> = {
  // sentadilla
  squat: "Sentadilla",
  "goblet squat": "Sentadilla goblet",
  "front squat": "Sentadilla frontal",
  "back squat": "Sentadilla trasera",
  "overhead squat": "Sentadilla overhead",
  "box squat": "Sentadilla al cajón",
  "sumo squat": "Sentadilla sumo",
  "wall squat": "Sentadilla en pared",
  "split squat": "Sentadilla dividida",
  "bulgarian split squat": "Sentadilla búlgara",
  "jump squat": "Sentadilla con salto",
  "step-up": "Subida al cajón",
  // zancada
  lunge: "Zancada",
  "walking lunge": "Zancada caminando",
  "reverse lunge": "Zancada hacia atrás",
  "forward lunge": "Zancada hacia delante",
  "lateral lunge": "Zancada lateral",
  "side lunge": "Zancada lateral",
  "curtsy lunge": "Zancada cruzada",
  "overhead lunge": "Zancada overhead",
  // bisagra
  deadlift: "Peso muerto",
  "romanian deadlift": "Peso muerto rumano",
  "sumo deadlift": "Peso muerto sumo",
  "stiff-leg deadlift": "Peso muerto con piernas rígidas",
  "straight-leg deadlift": "Peso muerto con piernas rígidas",
  "good morning": "Buenos días",
  "hip thrust": "Empuje de cadera (hip thrust)",
  "hip raise": "Elevación de cadera",
  "glute bridge": "Puente de glúteo",
  "hip hinge": "Bisagra de cadera",
  "kettlebell swing": "Balanceo de kettlebell",
  hyperextension: "Hiperextensión",
  "back extension": "Extensión lumbar",
  // empuje
  "push-up": "Flexión",
  "incline push-up": "Flexión inclinada",
  "decline push-up": "Flexión declinada",
  "knee push-up": "Flexión de rodillas",
  "diamond push-up": "Flexión diamante",
  "pike push-up": "Flexión en pica",
  "bench press": "Press de banca",
  "incline bench press": "Press de banca inclinado",
  "decline bench press": "Press de banca declinado",
  "chest press": "Press de pecho",
  "floor press": "Press en suelo",
  "shoulder press": "Press de hombros",
  "overhead press": "Press sobre la cabeza",
  "military press": "Press militar",
  "arnold press": "Press Arnold",
  "lateral raise": "Elevación lateral",
  "front raise": "Elevación frontal",
  "rear delt raise": "Elevación posterior de deltoides",
  "chest fly": "Apertura de pecho",
  "incline chest fly": "Apertura de pecho inclinada",
  "triceps extension": "Extensión de tríceps",
  "overhead triceps extension": "Extensión de tríceps sobre la cabeza",
  "triceps kickback": "Patada de tríceps",
  "triceps pushdown": "Extensión de tríceps en polea",
  // tirón
  row: "Remo",
  "bent-over row": "Remo inclinado",
  "seated row": "Remo sentado",
  "single-arm row": "Remo a un brazo",
  "inverted row": "Remo invertido",
  "upright row": "Remo al mentón",
  "lat pulldown": "Jalón al pecho",
  "pull-up": "Dominada",
  "chin-up": "Dominada supina",
  "face pull": "Face pull",
  "biceps curl": "Curl de bíceps",
  "hammer curl": "Curl martillo",
  "concentration curl": "Curl concentrado",
  "preacher curl": "Curl predicador",
  "reverse curl": "Curl invertido",
  shrug: "Encogimiento de hombros",
  // core
  plank: "Plancha",
  "side plank": "Plancha lateral",
  "reverse plank": "Plancha invertida",
  "forearm plank": "Plancha sobre antebrazos",
  "dead bug": "Dead bug",
  "bird dog": "Bird dog",
  crunch: "Crunch",
  "bicycle crunch": "Crunch de bicicleta",
  "reverse crunch": "Crunch inverso",
  "sit-up": "Abdominal (sit-up)",
  "russian twist": "Giro ruso",
  "mountain climber": "Escalador",
  "leg raise": "Elevación de piernas",
  "hanging leg raise": "Elevación de piernas colgado",
  "flutter kicks": "Pataditas (flutter kicks)",
  "v-up": "V-up",
  "hollow hold": "Posición hollow",
  // piernas aislado / carry
  "calf raise": "Elevación de gemelos",
  "seated calf raise": "Elevación de gemelos sentado",
  "leg curl": "Curl de pierna",
  "leg extension": "Extensión de piernas",
  "leg press": "Prensa de piernas",
  "farmer's carry": "Paseo del granjero",
  "suitcase carry": "Transporte tipo maleta",
  // movilidad / calentamiento
  "cat cow stretch": "Gato-camello",
  "cat camel": "Gato-camello",
  "child's pose stretch": "Postura del niño",
  "cobra stretch": "Estiramiento de cobra",
  "hamstring stretch": "Estiramiento de isquiotibiales",
  "glutes stretch": "Estiramiento de glúteos",
  "calf stretch": "Estiramiento de gemelos",
  "biceps stretch": "Estiramiento de bíceps",
  "lat stretch": "Estiramiento de dorsal",
  "arm circles": "Círculos de brazos",
  "ankle circles": "Círculos de tobillo",
  "hip circles": "Círculos de cadera",
  "neck tilts": "Inclinaciones de cuello",
  "thoracic rotation": "Rotación torácica",
  "inchworm": "Gusano (inchworm)",
  "world's greatest stretch": "El mejor estiramiento del mundo",
};

/** Modificadores de material: sufijo en español (en minúsculas). */
const EQUIPMENT_SUFFIX: Record<string, string> = {
  dumbbell: "con mancuernas",
  barbell: "con barra",
  kettlebell: "con kettlebell",
  cable: "en polea",
  band: "con banda",
  banded: "con banda",
  "smith machine": "en máquina Smith",
  "ez-bar": "con barra EZ",
  "ez bar": "con barra EZ",
  "swiss ball": "sobre pelota suiza",
  "medicine ball": "con balón medicinal",
  trx: "con TRX",
  suspension: "en suspensión",
};

const LATERALITY_SUFFIX: Record<string, string> = {
  "single-arm": "a un brazo",
  "one-arm": "a un brazo",
  "single-leg": "a una pierna",
  "one-leg": "a una pierna",
};

export interface TranslatedName {
  name_es: string;
  status: "auto" | "en";
}

/** Traduce un nombre visible de Garmin si, y solo si, todas sus piezas están en los diccionarios. */
export function translateName(nameEn: string): TranslatedName {
  let rest = nameEn.trim().toLowerCase();
  const suffixes: string[] = [];
  let weighted = false;
  let progress = true;
  while (progress) {
    progress = false;
    if (rest.startsWith("weighted ")) {
      weighted = true;
      rest = rest.slice("weighted ".length);
      progress = true;
      continue;
    }
    for (const dict of [LATERALITY_SUFFIX, EQUIPMENT_SUFFIX]) {
      const key = Object.keys(dict).find((k) => rest.startsWith(`${k} `));
      if (key) {
        suffixes.push(dict[key]);
        rest = rest.slice(key.length + 1);
        progress = true;
        break;
      }
    }
  }
  const move = MOVES[rest];
  if (!move) return { name_es: nameEn, status: "en" };
  const parts = [move, ...suffixes];
  if (weighted) parts.push("con peso");
  return { name_es: parts.join(" "), status: "auto" };
}
