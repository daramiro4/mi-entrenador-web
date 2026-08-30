import { Field } from "@/components/ui/Field";
import { TextInput, DateInput } from "@/components/ui/TextInput";

export function StepEventDetails({
  eventType,
  eventDate,
  onEventTypeChange,
  onEventDateChange,
}: {
  eventType: string;
  eventDate: string;
  onEventTypeChange: (value: string) => void;
  onEventDateChange: (value: string) => void;
}) {
  return (
    <div className="space-y-6">
      <Field label="¿Qué tipo de prueba es?">
        <TextInput
          placeholder="Ej. Marcha cicloturista, gran fondo, crono..."
          value={eventType}
          onChange={(e) => onEventTypeChange(e.target.value)}
        />
      </Field>
      <Field label="¿Cuándo es?">
        <DateInput value={eventDate} onChange={(e) => onEventDateChange(e.target.value)} />
      </Field>
    </div>
  );
}
