import { Field } from "@/components/ui/Field";
import { CheckboxGroup } from "@/components/ui/CheckboxGroup";
import type { FocusArea } from "@/lib/types";

const OPTIONS = [
  { value: "vo2max" as FocusArea, label: "VO2max", description: "Intervalos de alta intensidad" },
  { value: "general_health" as FocusArea, label: "Salud general", description: "Base aeróbica y consistencia" },
  { value: "climbing" as FocusArea, label: "Escalada", description: "Fuerza y potencia sostenida en subida" },
  { value: "rouleur" as FocusArea, label: "Ser mejor rodador", description: "Ritmo constante en llano" },
  { value: "weight_loss" as FocusArea, label: "Bajar peso", description: "Mejorar tu relación W/kg" },
];

export function StepFocusAreas({
  values,
  onChange,
}: {
  values: FocusArea[];
  onChange: (values: FocusArea[]) => void;
}) {
  return (
    <Field label="¿En qué quieres enfocar el entrenamiento?" hint="Puedes elegir varias.">
      <CheckboxGroup name="focus_areas" options={OPTIONS} values={values} onChange={onChange} />
    </Field>
  );
}
