import { Field } from "@/components/ui/Field";
import { NumberInput } from "@/components/ui/TextInput";

export function StepWeightGoal({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label="¿Cuál es tu peso objetivo?" hint="Opcional. Ayuda a calibrar el objetivo de FTP.">
      <NumberInput
        placeholder="kg"
        min={30}
        step={0.1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}
