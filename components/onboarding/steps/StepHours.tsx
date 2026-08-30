import { Field } from "@/components/ui/Field";
import { NumberInput } from "@/components/ui/TextInput";

export function StepHours({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label="¿Cuántas horas/semana puedes dedicar a la bici?">
      <NumberInput
        placeholder="horas"
        min={0}
        step={0.5}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}
