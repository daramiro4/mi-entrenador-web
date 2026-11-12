"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { HAS_PASSWORD_KEY, translateAuthError, validateNewPassword } from "@/lib/auth-validation";

/** Fija una contraseña nueva (usuario con sesión). `redirectTo`: ruta tras guardar (reset); sin ella, solo confirma. */
export function PasswordForm({ redirectTo, submitLabel = "Guardar contraseña", variant = "primary" }: { redirectTo?: string; submitLabel?: string; variant?: "primary" | "secondary" }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setDone(false);
    const problem = validateNewPassword(password, confirm);
    if (problem) {
      setError(problem);
      return;
    }
    setSaving(true);
    const { error: updateError } = await createClient().auth.updateUser({ password, data: { [HAS_PASSWORD_KEY]: true } });
    setSaving(false);
    if (updateError) {
      setError(translateAuthError(updateError.message));
      return;
    }
    setPassword("");
    setConfirm("");
    if (redirectTo) {
      router.replace(redirectTo);
      router.refresh();
      return;
    }
    setDone(true);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <label htmlFor="new-password" className="block text-sm text-fog">
          Contraseña nueva
        </label>
        <TextInput
          id="new-password"
          name="new-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="confirm-password" className="block text-sm text-fog">
          Repite la contraseña
        </label>
        <TextInput
          id="confirm-password"
          name="confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-fatiga">
          {error}
        </p>
      )}
      {done && <p role="status" className="text-sm text-accent">Contraseña actualizada.</p>}
      <Button type="submit" variant={variant} disabled={saving} className="w-full sm:w-auto">
        {saving ? "Guardando..." : submitLabel}
      </Button>
    </form>
  );
}
