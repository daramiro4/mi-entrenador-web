import { Field } from "@/components/ui/Field";
import { NumberInput, TextInput } from "@/components/ui/TextInput";
import type { FtpTargetResult } from "@/lib/ftp-calculator";

export function StepReview({
  autoFtpResult,
  currentWeightKg,
  hasFtpHistory,
  ftpValue,
  onFtpChange,
  seasonName,
  onSeasonNameChange,
}: {
  autoFtpResult: FtpTargetResult | null;
  currentWeightKg: number | null;
  hasFtpHistory: boolean;
  ftpValue: string;
  onFtpChange: (value: string) => void;
  seasonName: string;
  onSeasonNameChange: (value: string) => void;
}) {
  const lossKg =
    autoFtpResult && currentWeightKg != null && autoFtpResult.weightLossPct > 0
      ? currentWeightKg - autoFtpResult.effectiveTargetWeightKg
      : null;

  return (
    <div className="space-y-6">
      {autoFtpResult && (
        <div className="data-surface rounded-sm p-4 space-y-2">
          <p className="text-sm text-fog leading-relaxed">
            Partiendo de{" "}
            <span className="metric text-paper">{autoFtpResult.currentWkg.toFixed(2)} W/kg</span>{" "}
            (categoría {autoFtpResult.categoryLabel.toLowerCase()}), un objetivo realista en 4-5
            meses es{" "}
            <span className="metric text-volt">{autoFtpResult.targetWkg.toFixed(2)} W/kg</span>{" "}
            (<span className="metric">+{(autoFtpResult.ftpImprovementPct * 100).toFixed(0)}%</span>{" "}
            FTP
            {lossKg !== null && (
              <>
                {" "}
                + pérdida de <span className="metric">{lossKg.toFixed(1)} kg</span>
              </>
            )}
            ).
          </p>
          {autoFtpResult.weightGoalWasCapped && (
            <p className="text-sm text-fatiga">
              Tu objetivo de peso implicaba perder más de un 10% en este periodo; lo hemos
              ajustado a{" "}
              <span className="metric">{autoFtpResult.effectiveTargetWeightKg.toFixed(1)} kg</span>{" "}
              por seguridad.
            </p>
          )}
        </div>
      )}

      <Field
        label="FTP objetivo"
        hint={
          hasFtpHistory
            ? "Puedes ajustarlo antes de confirmar."
            : "Se recalculará automáticamente cuando registres un test de FTP."
        }
      >
        <NumberInput value={ftpValue} onChange={(e) => onFtpChange(e.target.value)} min={0} step={1} />
      </Field>

      <Field label="Nombre de la temporada">
        <TextInput value={seasonName} onChange={(e) => onSeasonNameChange(e.target.value)} />
      </Field>
    </div>
  );
}
