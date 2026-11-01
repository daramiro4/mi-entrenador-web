import type { Contraindication, Equipment, FormatSlug, Pattern } from "./types";

export const PATTERN_LABEL: Record<Pattern, string> = {
  hinge: "Bisagra de cadera",
  squat: "Sentadilla / zancada",
  push: "Empuje",
  pull: "Tirón",
  core: "Core",
  carry: "Acarreo",
  mobility: "Movilidad",
};

export const EQUIPMENT_LABEL: Record<Equipment, string> = {
  bodyweight: "Peso corporal",
  dumbbell: "Mancuernas",
  barbell: "Barra",
  machine: "Máquina",
  cable: "Polea",
  band: "Banda elástica",
  kettlebell: "Kettlebell",
};

export const AREA_LABEL: Record<Contraindication, string> = {
  low_back: "Zona lumbar",
  knee: "Rodilla",
  shoulder: "Hombro",
  neck: "Cuello",
  wrist: "Muñeca",
  hip: "Cadera",
  elbow: "Codo",
};

export const LEVEL_LABEL = { 1: "Nivel 1 · iniciación", 2: "Nivel 2 · intermedio", 3: "Nivel 3 · avanzado" } as const;

export const FORMAT_LABEL: Record<FormatSlug, string> = {
  circuito: "Circuito",
  amrap: "AMRAP",
  emom: "EMOM",
  contrarreloj: "Contrarreloj",
  piramide: "Pirámide",
};
