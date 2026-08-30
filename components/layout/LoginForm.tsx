"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";

type Status = "idle" | "sending" | "sent" | "error";

export function LoginForm({ initialError }: { initialError?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(
    initialError ? "El enlace no es válido o ha caducado. Pide uno nuevo." : null
  );

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("sending");
    setErrorMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div className="data-surface rounded-sm p-6 text-center space-y-2">
        <p className="font-display text-2xl uppercase text-paper">Revisa tu email</p>
        <p className="text-fog text-sm">
          Te hemos enviado un enlace de acceso a <span className="text-paper">{email}</span>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm text-fog">
          Email
        </label>
        <TextInput
          id="email"
          type="email"
          required
          autoComplete="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {errorMessage && <p className="text-sm text-fatiga">{errorMessage}</p>}

      <Button type="submit" disabled={status === "sending"} className="w-full">
        {status === "sending" ? "Enviando..." : "Enviar enlace de acceso"}
      </Button>
    </form>
  );
}
