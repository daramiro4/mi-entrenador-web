import { Field } from "@/components/ui/Field";
import { RadioGroup } from "@/components/ui/RadioGroup";
import type { GoalType } from "@/lib/types";

const OPTIONS = [
  { value: "ftp_improvement" as GoalType, label: "Mejorar mi FTP", description: "Subir potencia de forma sostenida" },
  { value: "event_prep" as GoalType, label: "Preparar un evento", description: "Una prueba o cita con fecha concreta" },
  { value: "maintenance" as GoalType, label: "Mantener la forma", description: "Sin objetivo de rendimiento agresivo" },
];

export function StepGoal({
  value,
  onChange,
}: {
  value: GoalType | null;
  onChange: (value: GoalType) => void;
}) {
  return (
    <Field label="¿Cuál es tu objetivo principal esta temporada?">
      <RadioGroup name="goal_type" options={OPTIONS} value={value} onChange={onChange} />
    </Field>
  );
}
