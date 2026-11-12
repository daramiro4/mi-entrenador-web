import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/ui/AppShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { PasswordForm } from "@/components/settings/PasswordForm";
import { ProvisionalFtpForm } from "@/components/settings/ProvisionalFtpForm";
import { getActiveSeason } from "@/lib/seasons";
import { getLatestFtp } from "@/lib/metrics";

export default async function AjustesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [season, latestFtp] = await Promise.all([getActiveSeason(supabase, user.id), getLatestFtp(supabase, user.id)]);

  return (
    <AppShell active={null}>
      <h1 className="mb-6 text-3xl font-semibold">Ajustes</h1>
      <div className="max-w-md space-y-6">
        {season && (
          <GlassCard>
            <h2 className="mb-1 text-lg font-semibold">FTP</h2>
            <p className="mb-4 text-sm text-label-2">
              {latestFtp
                ? `Tu FTP medido es ${latestFtp.ftp_watts} W (test de rampa) y es el que se usa para las zonas.`
                : "Aún no tienes un FTP medido. Mientras tanto las zonas usan el FTP que Garmin Connect tiene registrado o, si lo prefieres, el provisional que escribas aquí (tiene prioridad). Se sustituye solo cuando hagas el test de rampa."}
            </p>
            {!latestFtp && season.notes?.garmin_ftp_watts != null && (
              <p className="mb-4 text-sm text-label-2">
                Garmin Connect tiene registrado un FTP de <strong>{season.notes.garmin_ftp_watts} W</strong>
                {season.notes.garmin_ftp_date ? ` (leído el ${season.notes.garmin_ftp_date})` : ""}. Se usa solo si no escribes uno propio.
              </p>
            )}
            {!latestFtp && <ProvisionalFtpForm initialWatts={season.notes?.provisional_ftp_watts ?? null} />}
          </GlassCard>
        )}
        <GlassCard>
          <h2 className="mb-1 text-lg font-semibold">Contraseña</h2>
          <p className="mb-4 text-sm text-label-2">
            Cuenta: {user.email}. Con una contraseña puedes entrar sin depender del correo.
          </p>
          <PasswordForm variant="secondary" />
        </GlassCard>
      </div>
    </AppShell>
  );
}
