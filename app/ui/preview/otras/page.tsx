import { notFound } from "next/navigation";
import { AppShell } from "@/components/ui/AppShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { WorkoutsList } from "@/components/workouts/WorkoutsList";
import { WorkoutForm } from "@/components/workouts/WorkoutForm";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { PasswordForm } from "@/components/settings/PasswordForm";
import { ProvisionalFtpForm } from "@/components/settings/ProvisionalFtpForm";
import type { Workout } from "@/lib/types";

/** Galería de desarrollo (solo con UI_PREVIEW=1): Ajustes, Plantillas y Onboarding con datos de ejemplo. */
const sampleWorkouts = [
  {
    id: "w1", user_id: "u", name: "Umbral 2 x 15", type: "quality", ftp_ref: null, notes: null, created_at: "",
    intervals: [
      { kind: "warmup", duration_seconds: 600, target_low_pct_ftp: 50, target_high_pct_ftp: 65 },
      { kind: "interval", duration_seconds: 900, target_low_pct_ftp: 95, target_high_pct_ftp: 100 },
      { kind: "recovery", duration_seconds: 300, target_low_pct_ftp: 45, target_high_pct_ftp: 55 },
      { kind: "interval", duration_seconds: 900, target_low_pct_ftp: 95, target_high_pct_ftp: 100 },
      { kind: "cooldown", duration_seconds: 600, target_low_pct_ftp: 45, target_high_pct_ftp: 60 },
    ],
  },
  {
    id: "w2", user_id: "u", name: "Rodaje Z2 de 90", type: "z2", ftp_ref: null, notes: null, created_at: "",
    intervals: [{ kind: "interval", duration_seconds: 5400, target_low_pct_ftp: 65, target_high_pct_ftp: 75 }],
  },
] as unknown as Workout[];

export default function PreviewOtras() {
  if (process.env.UI_PREVIEW !== "1" && process.env.NODE_ENV === "production") notFound();
  return (
    <AppShell active={null}>
      <h1 className="mb-6 text-3xl">Ajustes</h1>
      <div className="mb-10 grid max-w-3xl gap-6 md:grid-cols-2">
        <GlassCard>
          <h2 className="mb-1 text-lg">FTP</h2>
          <p className="mb-4 text-sm text-label-2">Aún no tienes un FTP medido. Mientras tanto las zonas usan el FTP de Garmin o el provisional que escribas.</p>
          <ProvisionalFtpForm initialWatts={208} />
        </GlassCard>
        <GlassCard>
          <h2 className="mb-1 text-lg">Contraseña</h2>
          <p className="mb-4 text-sm text-label-2">Cuenta: david@ejemplo.com.</p>
          <PasswordForm variant="secondary" />
        </GlassCard>
      </div>

      <h1 className="mb-4 text-3xl">Plantillas de entreno</h1>
      <div className="mb-10 max-w-3xl"><WorkoutsList workouts={sampleWorkouts} /></div>
      <h2 className="mb-4 text-2xl">Nueva plantilla</h2>
      <div className="mb-10 max-w-3xl"><WorkoutForm mode="edit" workout={sampleWorkouts[0]} /></div>

      <h1 className="mb-4 text-3xl">Onboarding</h1>
      <div className="mx-auto max-w-xl space-y-6">
        <OnboardingWizard currentFtpWatts={null} currentWeightKg={82} />
      </div>
    </AppShell>
  );
}
