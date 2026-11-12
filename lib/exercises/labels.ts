import { MUSCLE_ES } from "./catalog";

/** Material en español. Todo valor de `equipment` del catálogo debe tener etiqueta (hay un test). */
export const EQUIPMENT_ES: Record<string, string> = {
  bodyweight: "Peso corporal",
  dumbbell: "Mancuernas",
  barbell: "Barra",
  kettlebell: "Kettlebell",
  band: "Banda elástica",
  cable: "Polea",
  machine: "Máquina",
  bench: "Banco",
  box: "Cajón",
  pull_up_bar: "Barra de dominadas",
  suspension: "Suspensión (TRX)",
  rings: "Anillas",
  stability_ball: "Pelota suiza",
  medicine_ball: "Balón medicinal",
  bosu: "Bosu",
  foam_roller: "Rodillo",
  plate: "Disco",
  sandbag: "Saco de arena",
  sled: "Trineo",
  battle_rope: "Cuerdas de batalla",
  sledgehammer: "Mazo",
  tire: "Neumático",
  ladder: "Escalera de agilidad",
  unknown: "Material sin indicar",
};

export const LEVEL_ES: Record<1 | 2 | 3, string> = { 1: "Nivel 1 · fácil", 2: "Nivel 2 · medio", 3: "Nivel 3 · avanzado" };
export const levelShort = (l: number | null): string => (l == null ? "Sin nivel" : `Nivel ${l}`);

export const equipmentLabel = (e: string): string => EQUIPMENT_ES[e] ?? e;
export const muscleLabel = (m: string): string => MUSCLE_ES[m] ?? m;
export const equipmentList = (eq: string[]): string => eq.map(equipmentLabel).join(" · ");
