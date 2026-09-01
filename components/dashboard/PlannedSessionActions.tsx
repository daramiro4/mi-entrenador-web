"use client";

import { useState, useTransition } from "react";
import {
  markPlannedSessionDoneAction,
  postponePlannedSessionAction,
  skipPlannedSessionAction,
  undoPlannedSessionStatusAction,
} from "@/app/dashboard/planned-session-actions";
import { PLANNED_SESSION_STATUS_LABEL, SESSION_TYPE_LABEL } from "@/lib/labels";
import type { ActivityRow, PlannedSession, StrengthSessionRow } from "@/lib/types";
import { getValidPostponeDates } from "@/lib/postpone";
import { getValidRedistributionDates } from "@/lib/redistribute";

function activityStats(
  session: PlannedSession,
  activity: ActivityRow | undefined
): { label: string; value: string }[] {
  if (!activity) return [];
  const stats: { label: string; value: string }[] = [];

  if (activity.tss != null) {
    stats.push({
      label: "TSS",
      value:
        session.planned_tss != null
          ? `${Math.round(activity.tss)} / ${session.planned_tss}`
          : `${Math.round(activity.tss)}`,
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

  return stats;
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
}: {
  session: PlannedSession;
  weekSessions: PlannedSession[];
  activities: ActivityRow[];
  strengthSessions: StrengthSessionRow[];
  today: string;
}) {
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
    const exercises =
      session.session_type === "strength" && linkedActivity
        ? strengthSessions.filter((s) => s.activity_id === linkedActivity.id)
        : [];

    return (
      <div className="pt-3 border-t border-fog/15 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-paper">{SESSION_TYPE_LABEL[session.session_type]}</span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-fog uppercase tracking-wide">
              {PLANNED_SESSION_STATUS_LABEL[session.status]}
            </span>
            {canUndo ? (
              <button
                type="button"
                disabled={isPending}
                onClick={() => runAction(() => undoPlannedSessionStatusAction(session.id))}
                className="text-xs text-fog hover:text-paper underline disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
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
                <p className="text-[10px] text-fog uppercase tracking-wide">{stat.label}</p>
              </div>
            ))}
          </div>
        )}
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
    <div className="pt-3 border-t border-fog/15 space-y-2">
      <span className="text-sm text-paper">{SESSION_TYPE_LABEL[session.session_type]}</span>

      {mode === "idle" && (
        <div className="flex gap-3">
          <button
            type="button"
            disabled={isPending}
            onClick={() => runAction(() => markPlannedSessionDoneAction(session.id))}
            className="text-xs text-volt hover:text-paper underline disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            Hecho
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={handleSkipClick}
            className="text-xs text-fog hover:text-paper underline disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            Saltar
          </button>
          <button
            type="button"
            disabled={isPending || postponeDates.length === 0}
            onClick={() => setMode("postponing")}
            className="text-xs text-fog hover:text-paper underline disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
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
                className="text-xs px-2.5 py-1 rounded-full border border-fog/30 text-fog hover:border-fog/60 hover:text-paper disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                {formatDayLabel(date)}
              </button>
            ))}
            <button
              type="button"
              disabled={isPending}
              onClick={() => setMode("idle")}
              className="text-xs text-fog hover:text-paper underline disabled:opacity-40 cursor-pointer"
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
                className="text-xs px-2.5 py-1 rounded-full border border-fog/30 text-fog hover:border-fog/60 hover:text-paper disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                {formatDayLabel(date)}
              </button>
            ))}
            <button
              type="button"
              disabled={isPending}
              onClick={() => runAction(() => skipPlannedSessionAction(session.id, null))}
              className="text-xs text-fog hover:text-paper underline disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              Saltar sin redistribuir
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setMode("idle")}
              className="text-xs text-fog hover:text-paper underline disabled:opacity-40 cursor-pointer"
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
