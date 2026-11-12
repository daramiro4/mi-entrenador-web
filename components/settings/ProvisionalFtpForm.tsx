"use client";

import { useState, useTransition, type FormEvent } from "react";
import { saveProvisionalFtpAction } from "@/app/ajustes/actions";
import { Button } from "@/components/ui/Button";
import { NumberInput } from "@/components/ui/TextInput";

/** FTP provisional: el punto de partida de las zonas hasta tener un test de rampa. */
export function ProvisionalFtpForm({ initialWatts }: { initialWatts: number | null }) {
  const [value, setValue] = useState(initialWatts != null ? String(initialWatts) : "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await saveProvisionalFtpAction(value);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setValue(String(result.value));
      setSaved(true);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="block text-sm text-label-2" htmlFor="provisional-ftp">
        FTP provisional (W)
      </label>
      <NumberInput
        id="provisional-ftp"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="p. ej. 208"
        min={80}
        max={500}
        step={1}
      />
      {error && <p className="text-sm text-fatiga">{error}</p>}
      {saved && <p className="text-sm text-label-2">Guardado.</p>}
      <Button type="submit" variant="secondary" disabled={isPending}>
        {isPending ? "Guardando..." : "Guardar FTP"}
      </Button>
    </form>
  );
}
