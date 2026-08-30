import { Field } from "@/components/ui/Field";
import { NumberInput } from "@/components/ui/TextInput";

export function StepFtpGoal({
  value,
  onChange,
  hasFtpHistory,
}: {
  value: string;
  onChange: (value: string) => void;
  hasFtpHistory: boolean;
}) {
  return (
    <Field
      label="¿Tienes un FTP objetivo en mente?"
      hint={
        hasFtpHistory
          ? "Opcional. Si lo dejas vacío, calcularemos uno realista con tu progreso."
          : "Aún no hay ningún test de FTP registrado, así que necesitamos un valor de partida manual. Se recalculará en cuanto registres un test."
      }
    >
      <NumberInput
        placeholder="watts"
        min={0}
        step={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}
