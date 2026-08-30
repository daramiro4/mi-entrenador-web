import type { FocusArea } from "./types";

export type WkgCategory =
  | "principiante"
  | "recreacional"
  | "aficionado_fuerte"
  | "competitivo"
  | "elite";

interface CategoryBracket {
  category: WkgCategory;
  label: string;
  minImprovementPct: number;
  maxImprovementPct: number;
}

const MAX_SAFE_WEIGHT_LOSS_PCT = 0.1;

// Rangos de mejora de FTP esperados en 4-5 meses, por nivel de partida (W/kg).
const BRACKETS: CategoryBracket[] = [
  { category: "principiante", label: "Principiante", minImprovementPct: 0.15, maxImprovementPct: 0.25 },
  { category: "recreacional", label: "Recreacional", minImprovementPct: 0.08, maxImprovementPct: 0.15 },
  { category: "aficionado_fuerte", label: "Aficionado fuerte", minImprovementPct: 0.04, maxImprovementPct: 0.08 },
  { category: "competitivo", label: "Competitivo", minImprovementPct: 0.02, maxImprovementPct: 0.05 },
  { category: "elite", label: "Élite", minImprovementPct: 0.01, maxImprovementPct: 0.02 },
];

function classifyWkg(wkg: number): CategoryBracket {
  if (wkg < 2.5) return BRACKETS[0];
  if (wkg < 3.5) return BRACKETS[1];
  if (wkg < 4.2) return BRACKETS[2];
  if (wkg < 5.0) return BRACKETS[3];
  return BRACKETS[4];
}

export interface FtpTargetInput {
  currentFtpWatts: number;
  currentWeightKg: number;
  focusAreas: FocusArea[];
  targetWeightKg?: number | null;
}

export interface FtpTargetResult {
  category: WkgCategory;
  categoryLabel: string;
  currentWkg: number;
  targetWkg: number;
  targetFtpWatts: number;
  ftpImprovementPct: number;
  weightLossPct: number;
  /** Peso objetivo final usado en el cálculo (ajustado si se superó el límite seguro). */
  effectiveTargetWeightKg: number;
  weightGoalWasCapped: boolean;
}

/**
 * Calcula un FTP objetivo realista a 4-5 meses a partir del nivel actual (W/kg).
 * Si el usuario también persigue bajar de peso, la mejora de potencia pura se
 * reduce para no pedir a la vez un gran salto de FTP y una pérdida de peso agresiva.
 */
export function calculateTargetFtp(input: FtpTargetInput): FtpTargetResult {
  const { currentFtpWatts, currentWeightKg, focusAreas, targetWeightKg } = input;

  const currentWkg = currentFtpWatts / currentWeightKg;
  const bracket = classifyWkg(currentWkg);
  const improvementGoalPct = (bracket.minImprovementPct + bracket.maxImprovementPct) / 2;

  const wantsWeightLoss = focusAreas.includes("weight_loss") && !!targetWeightKg;

  let weightLossPct = 0;
  let effectiveTargetWeightKg = targetWeightKg ?? currentWeightKg;
  let weightGoalWasCapped = false;

  if (wantsWeightLoss && targetWeightKg) {
    const rawLossPct = (currentWeightKg - targetWeightKg) / currentWeightKg;

    if (rawLossPct > MAX_SAFE_WEIGHT_LOSS_PCT) {
      weightGoalWasCapped = true;
      weightLossPct = MAX_SAFE_WEIGHT_LOSS_PCT;
      effectiveTargetWeightKg = currentWeightKg * (1 - MAX_SAFE_WEIGHT_LOSS_PCT);
    } else {
      weightLossPct = Math.max(rawLossPct, 0);
      effectiveTargetWeightKg = targetWeightKg;
    }
  }

  const ftpImprovementPct = wantsWeightLoss
    ? Math.max(improvementGoalPct - weightLossPct, bracket.minImprovementPct * 0.3)
    : improvementGoalPct;

  const targetFtpWatts = currentFtpWatts * (1 + ftpImprovementPct);
  const targetWkg = targetFtpWatts / effectiveTargetWeightKg;

  return {
    category: bracket.category,
    categoryLabel: bracket.label,
    currentWkg,
    targetWkg,
    targetFtpWatts,
    ftpImprovementPct,
    weightLossPct,
    effectiveTargetWeightKg,
    weightGoalWasCapped,
  };
}
