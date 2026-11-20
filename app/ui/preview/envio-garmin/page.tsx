import { notFound } from "next/navigation";
import { AppShell } from "@/components/ui/AppShell";
import { PreviewBody } from "@/components/dashboard/SendToGarminButton";
import type { GarminPreviewContext, GarminWorkoutPreview } from "@/lib/garmin";

const z2: GarminWorkoutPreview = {
  workout_name: "Z2 2026-11-20",
  estimated_duration_minutes: 60,
  steps: [{ label: "Intervalo", duration_minutes: 60, target_low_watts: 118, target_high_watts: 136 }],
};
const z2Context: GarminPreviewContext = {
  date: "2026-11-20",
  session_type: "z2",
  planned_tss: null,
  duration_minutes: 60,
  ftp_watts: 181,
  ftp_source: "measured",
  reacclimatization_discount_pct: -0.15,
  hr_discount_pct: 8,
};

const quality: GarminWorkoutPreview = {
  workout_name: "Calidad 2026-11-21",
  estimated_duration_minutes: 54,
  steps: [
    { label: "Calentamiento", duration_minutes: 10, target_low_watts: 110, target_high_watts: 130 },
    { label: "Intervalo x3", duration_minutes: 8, target_low_watts: 190, target_high_watts: 210 },
    { label: "Recuperación x3", duration_minutes: 4, target_low_watts: 100, target_high_watts: 120 },
    { label: "Enfriamiento", duration_minutes: 8, target_low_watts: 100, target_high_watts: 120 },
  ],
};
const qualityContext: GarminPreviewContext = {
  date: "2026-11-21",
  session_type: "quality",
  planned_tss: 80,
  duration_minutes: null,
  ftp_watts: 200,
  ftp_source: "provisional",
  reacclimatization_discount_pct: 0,
  hr_discount_pct: 0,
};

/** Ejemplo de la vista previa de "Enviar a Garmin" con datos de muestra (la real necesita sesión y el servicio de Garmin). */
export default function PreviewEnvioGarmin() {
  if (process.env.UI_PREVIEW !== "1" && process.env.NODE_ENV === "production") notFound();
  return (
    <AppShell active="hoy">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="data-surface w-full max-w-md space-y-4 p-4 text-left">
          <PreviewBody preview={z2} context={z2Context} />
        </div>
        <div className="data-surface w-full max-w-md space-y-4 p-4 text-left">
          <PreviewBody preview={quality} context={qualityContext} />
        </div>
      </div>
    </AppShell>
  );
}
