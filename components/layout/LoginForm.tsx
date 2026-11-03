"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { translateAuthError, validateLogin, isValidEmail } from "@/lib/auth-validation";

type Mode = "password" | "magic" | "reset";
type Status = "idle" | "sending" | "sent";

const SENT_COPY: Record<Exclude<Mode, "password">, string> = {
  magic: "Te hemos enviado un enlace de acceso a",
  reset: "Te hemos enviado un enlace para elegir una contraseña nueva a",
};

export function LoginForm({ initialError }: { initialError?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(
    initialError ? "El enlace no es válido o ha caducado. Entra con tu contraseña o pide uno nuevo." : null
  );

  function switchMode(next: Mode) {
    setMode(next);
    setErrorMessage(null);
    setStatus("idle");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErrorMessage(null);

    const problem =
      mode === "password"
        ? validateLogin(email, password)
        : !email.trim()
          ? "Escribe tu email."
          : !isValidEmail(email)
            ? "El email no parece válido."
            : null;
    if (problem) {
      setErrorMessage(problem);
      return;
    }

    setStatus("sending");
    const supabase = createClient();
    const cleanEmail = email.trim();

    if (mode === "password") {
      const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      if (error) {
        setStatus("idle");
        setErrorMessage(translateAuthError(error.message));
        return;
      }
      router.replace("/");
      router.refresh();
      return;
    }

    const { error } =
      mode === "magic"
        ? await supabase.auth.signInWithOtp({
            email: cleanEmail,
            options: {
              // Solo entran cuentas existentes: este formulario nunca crea usuarios.
              shouldCreateUser: false,
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          })
        : await supabase.auth.resetPasswordForEmail(cleanEmail, {
            redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset`,
          });

    if (error) {
      setStatus("idle");
      setErrorMessage(translateAuthError(error.message));
      return;
    }
    setStatus("sent");
  }

  if (status === "sent" && mode !== "password") {
    return (
      <div className="data-surface p-6 text-center space-y-3">
        <p className="font-display text-2xl text-paper">Revisa tu email</p>
        <p className="text-fog text-sm">
          {SENT_COPY[mode]} <span className="text-paper">{email.trim()}</span>.
        </p>
        <p className="text-fog text-xs">Ábrelo en este mismo navegador (el enlace solo funciona una vez).</p>
        <button type="button" onClick={() => switchMode("password")} className="text-sm text-accent cursor-pointer">
          Volver a entrar con contraseña
        </button>
      </div>
    );
  }

  const busy = status === "sending";

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm text-fog">
          Email
        </label>
        <TextInput
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {mode === "password" && (
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm text-fog">
            Contraseña
          </label>
          <TextInput
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      )}

      {errorMessage && (
        <p role="alert" className="text-sm text-fatiga">
          {errorMessage}
        </p>
      )}

      <Button type="submit" disabled={busy} className="w-full">
        {busy
          ? "Enviando..."
          : mode === "password"
            ? "Entrar"
            : mode === "magic"
              ? "Enviar enlace de acceso"
              : "Enviar enlace para cambiar la contraseña"}
      </Button>

      <div className="flex flex-col items-center gap-2 pt-1 text-sm">
        {mode === "password" ? (
          <>
            <button type="button" onClick={() => switchMode("reset")} className="text-accent cursor-pointer">
              He olvidado la contraseña
            </button>
            <button type="button" onClick={() => switchMode("magic")} className="text-fog cursor-pointer">
              Entrar con un enlace por email
            </button>
          </>
        ) : (
          <button type="button" onClick={() => switchMode("password")} className="text-accent cursor-pointer">
            Volver a entrar con contraseña
          </button>
        )}
      </div>
    </form>
  );
}
