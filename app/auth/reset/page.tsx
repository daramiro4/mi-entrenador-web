import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PasswordForm } from "@/components/settings/PasswordForm";

/** Destino del enlace de "He olvidado la contraseña": /auth/callback abre sesión y redirige aquí. */
export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?error=auth");

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <p className="font-display text-3xl text-paper">Nueva contraseña</p>
          <p className="text-fog text-sm">Elige la contraseña con la que entrarás a partir de ahora.</p>
        </div>
        <PasswordForm redirectTo="/" submitLabel="Guardar y entrar" />
      </div>
    </main>
  );
}
