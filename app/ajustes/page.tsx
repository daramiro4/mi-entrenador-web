import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/ui/AppShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { PasswordForm } from "@/components/settings/PasswordForm";

export default async function AjustesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <AppShell active={null}>
      <h1 className="mb-6 text-3xl font-semibold">Ajustes</h1>
      <div className="max-w-md">
        <GlassCard>
          <h2 className="mb-1 text-lg font-semibold">Contraseña</h2>
          <p className="mb-4 text-sm text-label-2">
            Cuenta: {user.email}. Con una contraseña puedes entrar sin depender del correo.
          </p>
          <PasswordForm />
        </GlassCard>
      </div>
    </AppShell>
  );
}
