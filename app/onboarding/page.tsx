import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveSeason } from "@/lib/seasons";
import { getLatestFtp, getLatestWeightKg } from "@/lib/metrics";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const activeSeason = await getActiveSeason(supabase, user.id);
  if (activeSeason) {
    redirect("/dashboard");
  }

  const [latestFtp, latestWeightKg] = await Promise.all([
    getLatestFtp(supabase, user.id),
    getLatestWeightKg(supabase, user.id),
  ]);

  return (
    <main className="flex-1 px-6 py-10 md:py-16">
      <div className="max-w-xl mx-auto space-y-8">
        <div className="space-y-1">
          <p className="font-display text-3xl uppercase tracking-wide text-paper">
            Vamos a montar tu temporada
          </p>
          <p className="text-fog text-sm">
            Unas preguntas rápidas para calibrar tu plan de entrenamiento.
          </p>
        </div>
        <OnboardingWizard
          currentFtpWatts={latestFtp?.ftp_watts ?? null}
          currentWeightKg={latestWeightKg}
        />
      </div>
    </main>
  );
}
