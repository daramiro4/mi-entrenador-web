import { Field } from "@/components/ui/Field";
import { NumberInput } from "@/components/ui/TextInput";

export function StepStrength({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label="¿Cuántos días/semana entrenas fuerza en el gimnasio?">
      <NumberInput
        placeholder="días"
        min={0}
        max={7}
        step={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}
