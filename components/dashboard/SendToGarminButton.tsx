"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";
import {
  previewPlannedSessionToGarminAction,
  sendPlannedSessionToGarminAction,
} from "@/app/dashboard/garmin-actions";
import { Button } from "@/components/ui/Button";
import type { GarminPreviewContext, GarminWorkoutPreview } from "@/lib/garmin";
import { describeFtpBasis, describePreviewDetail } from "@/lib/garmin-preview-detail";
import { SESSION_TYPE_LABEL } from "@/lib/labels";

function longDate(date: string): string {
  return new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long" }).format(new Date(`${date}T12:00:00`));
}

const subscribeNoop = () => () => {};

type Mode = "idle" | "previewing" | "sent";

/**
 * "Enviar a Garmin": vista previa en un panel fijo (portal a <body>, no lo tapa el calendario) y confirmación.
 * `variant="primary"` es el botón principal de la vista (uno solo); `secondary` para el resto.
 */
export function SendToGarminButton({
  plannedSessionId,
  variant = "secondary",
  disabled = false,
}: {
  plannedSessionId: string;
  variant?: "primary" | "secondary";
  disabled?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<Mode>("idle");
  const [preview, setPreview] = useState<GarminWorkoutPreview | null>(null);
  const [context, setContext] = useState<GarminPreviewContext | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Portal a <body>: el globo no puede quedar tapado por el contexto de apilamiento de la celda del día.
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);

  const handlePreviewClick = () => {
    setError(null);
    startTransition(async () => {
      const outcome = await previewPlannedSessionToGarminAction(plannedSessionId);
      if (!outcome.ok || !outcome.preview) {
        setError(outcome.error);
        return;
      }
      setPreview(outcome.preview);
      setContext(outcome.context ?? null);
      setMode("previewing");
    });
  };

  const handleConfirm = () => {
    setError(null);
    startTransition(async () => {
      const outcome = await sendPlannedSessionToGarminAction(plannedSessionId);
      if (!outcome.ok) {
        setError(outcome.error);
        return;
      }
      setMode("sent");
    });
  };

  const handleCancel = () => {
    setPreview(null);
    setContext(null);
    setError(null);
    setMode("idle");
  };

  if (mode === "sent") {
    return (
      <span className="inline-flex min-h-11 items-center gap-2 px-2 text-sm text-accent" role="status">
        <Check size={16} aria-hidden="true" /> Enviada al reloj
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        variant={variant === "primary" ? "primary" : "secondary"}
        onClick={handlePreviewClick}
        disabled={isPending || disabled}
      >
        {isPending && mode === "idle" ? "Cargando..." : "Enviar a Garmin"}
      </Button>
      {error && mode === "idle" && <span className="text-sm text-danger">{error}</span>}

      {mode === "previewing" && preview && mounted &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-3 sm:items-center"
            onClick={() => !isPending && handleCancel()}
            role="presentation"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Vista previa del entreno para Garmin"
              onClick={(e) => e.stopPropagation()}
              className="data-surface max-h-[88dvh] w-full max-w-md space-y-4 overflow-y-auto p-4 text-left"
            >
              <PreviewBody preview={preview} context={context} />
              {error && <p className="text-sm text-danger">{error}</p>}
              <div className="flex flex-wrap gap-2 pt-1 pb-[env(safe-area-inset-bottom)]">
                <Button type="button" disabled={isPending} onClick={handleConfirm}>
                  {isPending ? "Enviando..." : "Confirmar envío"}
                </Button>
                <Button type="button" variant="ghost" disabled={isPending} onClick={handleCancel}>
                  Cancelar
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-[12px] bg-surface-2 px-3 py-2">
      <p className="font-mono text-base text-label">{value}</p>
      <p className="text-[11px] text-label-2">{label}</p>
      {hint && <p className="text-[10px] text-label-2">{hint}</p>}
    </div>
  );
}

/** Cuerpo de la vista previa: qué entreno es, cuánto cuesta y de dónde salen los vatios, antes de confirmar el envío. */
export function PreviewBody({ preview, context }: { preview: GarminWorkoutPreview; context: GarminPreviewContext | null }) {
  const detail = describePreviewDetail(preview, context);
  const basis = context ? describeFtpBasis(context) : [];
  const tssPlanned = context?.planned_tss ?? null;

  return (
    <>
      <div>
        <p className="font-display text-2xl">{preview.workout_name}</p>
        {context && (
          <p className="mt-0.5 text-sm text-label-2 first-letter:uppercase">
            {longDate(context.date)} · {SESSION_TYPE_LABEL[context.session_type]}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Stat label="Duración" value={`${preview.estimated_duration_minutes} min`} />
        {detail.avgWatts != null && <Stat label="Potencia media" value={`≈ ${detail.avgWatts} W`} />}
        {detail.estimatedTss != null && (
          <Stat
            label="TSS de este entreno"
            value={`≈ ${detail.estimatedTss}`}
            hint={tssPlanned != null ? `planificado ${tssPlanned}` : undefined}
          />
        )}
        {detail.intensityFactor != null && (
          <Stat label="Intensidad (IF)" value={detail.intensityFactor.toFixed(2).replace(".", ",")} hint="1,00 = tu FTP" />
        )}
      </div>

      {detail.blocks.length > 1 && (
        <div aria-hidden="true" className="flex h-3 w-full gap-px overflow-hidden rounded-full">
          {detail.blocks.map((block, i) => (
            <div
              key={i}
              style={{ flexGrow: block.minutes }}
              className={block.label === "Intervalo" || block.label === "Rodaje Z2" ? "bg-accent" : "bg-label-2/40"}
            />
          ))}
        </div>
      )}

      <div>
        <p className="mb-1 font-mono text-[11px] uppercase tracking-wider text-label-2">Pasos</p>
        <ul className="space-y-2">
          {detail.blocks.map((block, index) => (
            <li key={index} className="text-sm">
              <p>
                <span className="text-label">{block.label}</span>{" "}
                <span className="font-mono text-label-2">
                  {block.reps > 1 ? `${block.reps} × ${block.minutesEach} min` : `${block.minutes} min`}
                </span>
              </p>
              {block.wattsLow != null && (
                <p className="font-mono text-xs text-label-2">
                  {block.wattsLow}-{block.wattsHigh} W
                  {block.pctLow != null && ` · ${block.pctLow}-${block.pctHigh} % FTP`}
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>

      {basis.length > 0 && (
        <div className="space-y-0.5 border-t border-separator pt-3">
          {basis.map((line) => (
            <p key={line} className="text-xs text-label-2">
              {line}
            </p>
          ))}
        </div>
      )}
      <p className="text-xs text-label-2">
        Al confirmar se programa en tu Garmin Connect{context ? ` para el ${longDate(context.date)}` : ""} y pasa al reloj al sincronizarlo.
      </p>
    </>
  );
}
