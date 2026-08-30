import { Field } from "@/components/ui/Field";
import { TextArea } from "@/components/ui/TextArea";

export function StepNotes({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label="¿Algo que debamos tener en cuenta?" hint="Opcional: lesiones, limitaciones, horarios...">
      <TextArea
        placeholder="Cuéntanos lo que necesitemos saber"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}
