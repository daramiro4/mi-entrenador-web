"use client";

import { useState, useTransition } from "react";
import {
  markPlannedSessionDoneAction,
  postponePlannedSessionAction,
  skipPlannedSessionAction,
  undoPlannedSessionStatusAction,
} from "@/app/dashboard/planned-session-actions";
import { PLANNED_SESSION_STATUS_LABEL, SESSION_TYPE_LABEL } from "@/lib/labels";
import type { ActivityRow, HrZoneSeconds, PlannedSession, StrengthSessionRow } from "@/lib/types";
import { getValidPostponeDates } from "@/lib/postpone";
import { getValidRedistributionDates } from "@/lib/redistribute";
import { formatHrZoneMinutes } from "@/lib/hr-zones";
import { describeHrAdjustment } from "@/lib/hr-adjustment";
import { plannedStrengthTssForSession, strengthActivityTss } from "@/lib/strength/tss";
import { SendToGarminButton } from "./SendToGarminButton";

const GARMIN_SEND_TYPES = new Set(["quality", "z2"]);

function activityStats(
  session: PlannedSession,
  activity: ActivityRow | undefined
): { label: string; value: string }[] {
  if (!activity) return [];
  const stats: { label: string; value: string }[] = [];

  // Fuerza: Garmin no da TSS; se estima con su training_load (marcado con «≈») y se compara con el objetivo estimado de la sesión.
  const strength = activity.activity_type === "strength" ? strengthActivityTss(activity) : null;
  const tssValue = strength ? strength.tss : activity.tss;
  if (tssValue != null) {
    const approx = strength?.estimated ? "≈" : "";
    const target = session.planned_tss ?? plannedStrengthTssForSession(session);
    stats.push({
      label: "TSS",
      value: target != null ? `${approx}${Math.round(tssValue)} / ${Math.round(target)}` : `${approx}${Math.round(tssValue)}`,
    });
  }
  if (activity.normalized_power != null) {
    stats.push({ label: "Pot. normalizada", value: `${Math.round(activity.normalized_power)} W` });
  } else if (activity.avg_power != null) {
    stats.push({ label: "Pot. media", value: `${Math.round(activity.avg_power)} W` });
  }
  if (activity.duration_minutes != null) {
    stats.push({ label: "Duración", value: `${Math.round(activity.duration_minutes)} min` });
  }
  if (activity.avg_hr != null) {
    stats.push({ label: "FC media", value: `${Math.round(activity.avg_hr)} ppm` });
  }
  if (activity.max_hr != null) {
    stats.push({ label: "FC máx", value: `${Math.round(activity.max_hr)} ppm` });
  }

  return stats;
}

function hrZoneSummary(activity: ActivityRow | undefined): string | null {
  if (!activity?.hr_zone_seconds) return null;
  const zones = formatHrZoneMinutes(activity.hr_zone_seconds as unknown as HrZoneSeconds);
  if (zones.length === 0) return null;
  return zones.map((z) => `${z.zone} ${z.minutes}min`).join(" · ");
}

function formatExercise(row: StrengthSessionRow): string {
  const parts: string[] = [];
  if (row.sets != null && row.reps != null) parts.push(`${row.sets}×${row.reps}`);
  if (row.weight_kg != null) parts.push(`${row.weight_kg} kg`);
  return parts.length > 0 ? `${row.exercise} — ${parts.join(" @ ")}` : row.exercise;
}

const WEEKDAY_LABELS = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];

function formatDayLabel(date: string): string {
  const dow = new Date(`${date}T00:00:00Z`).getUTCDay();
  const index = dow === 0 ? 6 : dow - 1;
  return `${WEEKDAY_LABELS[index]} ${date.slice(8, 10)}`;
}

type Mode = "idle" | "postponing" | "skipping";

export function PlannedSessionActions({
  session,
  weekSessions,
  activities,
  strengthSessions,
  today,
  embedded = false,
  showSend = true,
}: {
  session: PlannedSession;
  weekSessions: PlannedSession[];
  activities: ActivityRow[];
  strengthSessions: StrengthSessionRow[];
  today: string;
  /** Dentro de la tarjeta "Sesión de hoy": sin título ni borde propios. */
  embedded?: boolean;
  /** Mostrar "Enviar a Garmin" (secundario). En la tarjeta de hoy es el botón principal, aparte. */
  showSend?: boolean;
}) {
  const wrapperClass = embedded ? "space-y-2" : "pt-3 border-t border-separator space-y-2";
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("idle");

  const runAction = (action: () => Promise<{ ok: boolean; error: string | null }>) => {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.error);
      } else {
        setMode("idle");
      }
    });
  };

  if (session.status === "done" || session.status === "skipped") {
    const canUndo = !session.notes?.redistributed_to_session_id;
    const linkedActivity =
      session.actual_activity_id != null
        ? activities.find((a) => a.id === session.actual_activity_id)
        : undefined;
    const stats = activityStats(session, linkedActivity);
    const hrZones = hrZoneSummary(linkedActivity);
    const hrAdjustmentNote = describeHrAdjustment(session.notes?.hr_adjustment);
    const exercises =
      session.session_type === "strength" && linkedActivity
        ? strengthSessions.filter((s) => s.activity_id === linkedActivity.id)
        : [];

    return (
      <div className={wrapperClass}>
        <div className="flex items-center justify-between">
          <span className="text-sm text-paper">{SESSION_TYPE_LABEL[session.session_type]}</span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-fog">
              {PLANNED_SESSION_STATUS_LABEL[session.status]}
            </span>
            {canUndo ? (
              <button
                type="button"
                disabled={isPending}
                onClick={() => runAction(() => undoPlannedSessionStatusAction(session.id))}
                className="inline-flex min-h-11 items-center rounded-full bg-surface-2 px-4 text-sm font-medium text-label hover:brightness-110 disabled:pointer-events-none disabled:opacity-40 cursor-pointer"
              >
                Deshacer
              </button>
            ) : (
              <span className="text-xs text-fog" title="El TSS ya se movió a otro día">
                (TSS movido)
              </span>
            )}
          </div>
        </div>
        {stats.length > 0 && (
          <div className="flex gap-6">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="metric text-sm text-paper">{stat.value}</p>
                <p className="text-xs text-label-2">{stat.label}</p>
              </div>
            ))}
          </div>
        )}
        {hrZones && <p className="text-xs text-fog">{hrZones}</p>}
        {hrAdjustmentNote && <p className="text-xs text-ember">{hrAdjustmentNote}</p>}
        {exercises.length > 0 && (
          <ul className="space-y-1">
            {exercises.map((exercise) => (
              <li key={exercise.id} className="text-xs text-paper">
                {formatExercise(exercise)}
              </li>
            ))}
          </ul>
        )}
        {session.session_type === "strength" && linkedActivity && exercises.length === 0 && (
          <p className="text-xs text-fog">Sin ejercicios registrados para esta sesión.</p>
        )}
        {error && <p className="text-xs text-fatiga">{error}</p>}
      </div>
    );
  }

  const postponeDates = getValidPostponeDates(weekSessions, session, today);
  const redistributeDates = getValidRedistributionDates(weekSessions, session, today);

  const handleSkipClick = () => {
    if (session.planned_tss == null) {
      runAction(() => skipPlannedSessionAction(session.id, null));
      return;
    }
    setMode("skipping");
  };

  return (
    <div className={wrapperClass}>
      {!embedded && <span className="text-sm text-paper">{SESSION_TYPE_LABEL[session.session_type]}</span>}

      {mode === "idle" && (
        <div className="flex flex-wrap items-center gap-2">
          {showSend && GARMIN_SEND_TYPES.has(session.session_type) && (
            <SendToGarminButton plannedSessionId={session.id} variant="secondary" />
          )}
          <button
            type="button"
            disabled={isPending}
            onClick={() => runAction(() => markPlannedSessionDoneAction(session.id))}
            className="inline-flex min-h-11 items-center rounded-full bg-surface-2 px-4 text-sm font-medium text-label hover:brightness-110 disabled:pointer-events-none disabled:opacity-40 cursor-pointer"
          >
            Marcar hecha
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={handleSkipClick}
            className="inline-flex min-h-11 items-center rounded-full bg-surface-2 px-4 text-sm font-medium text-label hover:brightness-110 disabled:pointer-events-none disabled:opacity-40 cursor-pointer"
          >
            Saltar
          </button>
          <button
            type="button"
            disabled={isPending || postponeDates.length === 0}
            onClick={() => setMode("postponing")}
            className="inline-flex min-h-11 items-center rounded-full bg-surface-2 px-4 text-sm font-medium text-label hover:brightness-110 disabled:pointer-events-none disabled:opacity-40 cursor-pointer"
          >
            Posponer
          </button>
        </div>
      )}

      {mode === "postponing" && (
        <div className="space-y-2">
          <p className="text-xs text-fog">Mover a:</p>
          <div className="flex flex-wrap gap-2">
            {postponeDates.map((date) => (
              <button
                key={date}
                type="button"
                disabled={isPending}
                onClick={() =>
                  runAction(() => postponePlannedSessionAction(session.id, date))
                }
                className="inline-flex min-h-11 items-center rounded-full bg-surface-2 px-4 text-sm font-medium text-label hover:brightness-110 disabled:pointer-events-none disabled:opacity-40 cursor-pointer font-mono"
              >
                {formatDayLabel(date)}
              </button>
            ))}
            <button
              type="button"
              disabled={isPending}
              onClick={() => setMode("idle")}
              className="inline-flex min-h-11 items-center rounded-full px-3 text-sm text-label-2 hover:text-label disabled:pointer-events-none disabled:opacity-40 cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {mode === "skipping" && (
        <div className="space-y-2">
          <p className="text-xs text-fog">
            TSS perdido: {session.planned_tss}
            {redistributeDates.length > 0 ? " — mover a:" : " — no hay días válidos para moverlo."}
          </p>
          <div className="flex flex-wrap gap-2 items-center">
            {redistributeDates.map((date) => (
              <button
                key={date}
                type="button"
                disabled={isPending}
                onClick={() =>
                  runAction(() => skipPlannedSessionAction(session.id, date))
                }
                className="inline-flex min-h-11 items-center rounded-full bg-surface-2 px-4 text-sm font-medium text-label hover:brightness-110 disabled:pointer-events-none disabled:opacity-40 cursor-pointer font-mono"
              >
                {formatDayLabel(date)}
              </button>
            ))}
            <button
              type="button"
              disabled={isPending}
              onClick={() => runAction(() => skipPlannedSessionAction(session.id, null))}
              className="inline-flex min-h-11 items-center rounded-full bg-surface-2 px-4 text-sm font-medium text-label hover:brightness-110 disabled:pointer-events-none disabled:opacity-40 cursor-pointer"
            >
              Saltar sin redistribuir
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setMode("idle")}
              className="inline-flex min-h-11 items-center rounded-full px-3 text-sm text-label-2 hover:text-label disabled:pointer-events-none disabled:opacity-40 cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-fatiga">{error}</p>}
    </div>
  );
}
