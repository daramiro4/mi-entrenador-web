"use client";

import { useState, useTransition } from "react";
import {
  markPlannedSessionDoneAction,
  postponePlannedSessionAction,
  skipPlannedSessionAction,
} from "@/app/dashboard/planned-session-actions";
import { PLANNED_SESSION_STATUS_LABEL, SESSION_TYPE_LABEL } from "@/lib/labels";
import type { PlannedSession } from "@/lib/types";
import { getValidPostponeDates } from "@/lib/postpone";

const WEEKDAY_LABELS = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];

function formatDayLabel(date: string): string {
  const dow = new Date(`${date}T00:00:00Z`).getUTCDay();
  const index = dow === 0 ? 6 : dow - 1;
  return `${WEEKDAY_LABELS[index]} ${date.slice(8, 10)}`;
}

export function PlannedSessionActions({
  session,
  weekSessions,
  today,
}: {
  session: PlannedSession;
  weekSessions: PlannedSession[];
  today: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [postponing, setPostponing] = useState(false);

  if (session.status === "done" || session.status === "skipped") {
    return (
      <div className="pt-3 border-t border-fog/15 flex items-center justify-between">
        <span className="text-sm text-paper">{SESSION_TYPE_LABEL[session.session_type]}</span>
        <span className="text-xs text-fog uppercase tracking-wide">
          {PLANNED_SESSION_STATUS_LABEL[session.status]}
        </span>
      </div>
    );
  }

  const validDates = getValidPostponeDates(weekSessions, session, today);

  const runAction = (action: () => Promise<{ ok: boolean; error: string | null }>) => {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.error);
      } else {
        setPostponing(false);
      }
    });
  };

  return (
    <div className="pt-3 border-t border-fog/15 space-y-2">
      <span className="text-sm text-paper">{SESSION_TYPE_LABEL[session.session_type]}</span>

      {!postponing ? (
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
            onClick={() => runAction(() => skipPlannedSessionAction(session.id))}
            className="text-xs text-fog hover:text-paper underline disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            Saltar
          </button>
          <button
            type="button"
            disabled={isPending || validDates.length === 0}
            onClick={() => setPostponing(true)}
            className="text-xs text-fog hover:text-paper underline disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            Posponer
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-fog">Mover a:</p>
          <div className="flex flex-wrap gap-2">
            {validDates.map((date) => (
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
              onClick={() => setPostponing(false)}
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
