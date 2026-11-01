"use client";

import { useState, useTransition } from "react";
import { Watch } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SingleChoice } from "@/components/ui/Choice";
import { sendToForerunnerAction } from "@/app/fuerza/garmin-actions";
import { todayISODate, addDays } from "@/lib/week";
import type { GarminSendOutcome } from "@/lib/strength/garmin-send";

/**
 * Envío al Forerunner con confirmación previa. Con GARMIN_SEND_ENABLED apagado
 * (por defecto) el botón queda en estado "Próximamente".
 */
export function SendToForerunner({ workoutId, enabled }: { workoutId: string; enabled: boolean }) {
  const [preview, setPreview] = useState<Extract<GarminSendOutcome, { ok: true }> | null>(null);
  const [when, setWhen] = useState<"today" | "tomorrow">("today");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!enabled) {
    return (
      <Button variant="secondary" disabled aria-label="Enviar al Forerunner (próximamente)">
        <Watch size={18} strokeWidth={1.75} aria-hidden="true" className="mr-2" />
        Enviar al Forerunner · Próximamente
      </Button>
    );
  }

  const date = when === "today" ? todayISODate() : addDays(todayISODate(), 1);

  return (
    <div className="w-full">
      <Button
        variant="secondary"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setMsg(null);
            const r = await sendToForerunnerAction(workoutId, { dryRun: true });
            if (r.ok) setPreview(r);
            else setMsg(r.error);
          })
        }
      >
        <Watch size={18} strokeWidth={1.75} aria-hidden="true" className="mr-2" />
        {pending && !preview ? "Preparando…" : "Enviar al Forerunner"}
      </Button>
      {preview && (
        <div className="tile mt-3 grid gap-3" role="dialog" aria-label="Confirmar envío al Forerunner">
          <p className="font-medium">{preview.payload.workoutName} · {preview.steps} pasos</p>
          <ul className="list-disc pl-5 text-sm text-label-2">
            {preview.notes.map((n) => <li key={n}>{n}</li>)}
          </ul>
          <fieldset className="grid gap-1">
            <legend className="mb-1 text-sm font-medium">Programar en tu calendario de Garmin</legend>
            <SingleChoice name="Día" value={when} onChange={setWhen} options={[{ value: "today", label: "Hoy" }, { value: "tomorrow", label: "Mañana" }]} />
          </fieldset>
          <div className="flex gap-2">
            <Button
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const r = await sendToForerunnerAction(workoutId, { dryRun: false, date });
                  if (r.ok && !r.dry_run) { setMsg(`Enviado a tu Forerunner (ID ${r.garmin_workout_id ?? "—"}).`); setPreview(null); }
                  else setMsg(r.ok ? "El envío real está desactivado." : r.error);
                })
              }
            >
              {pending ? "Enviando…" : "Confirmar envío"}
            </Button>
            <Button variant="ghost" onClick={() => setPreview(null)}>Cancelar</Button>
          </div>
        </div>
      )}
      {msg && <p role="status" className="mt-2 text-sm text-label-2">{msg}</p>}
    </div>
  );
}
