"use client";

import { useState } from "react";
import { SESSION_TYPE_CIRCLE_CLASS, SESSION_TYPE_LABEL } from "@/lib/labels";
import type { PlannedSession } from "@/lib/types";
import { getWeekdayIndex } from "@/lib/week";
import { SendToGarminButton } from "./SendToGarminButton";
import { PlannedSessionActions } from "./PlannedSessionActions";

const DAYS = ["L", "M", "X", "J", "V", "S", "D"];
const GARMIN_ELIGIBLE_SESSION_TYPES = new Set(["quality", "z2"]);

export function WeeklyStrip({
  sessions,
  today,
}: {
  sessions: PlannedSession[];
  today: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const sessionsByWeekday = new Array<PlannedSession | undefined>(7);
  for (const session of sessions) {
    sessionsByWeekday[getWeekdayIndex(session.date)] = session;
  }

  const selectedSession = sessions.find((s) => s.id === selectedId) ?? null;

  return (
    <div className="data-surface rounded-sm p-5">
      <p className="text-xs text-fog uppercase tracking-wide mb-3">Esta semana</p>
      <div className="grid grid-cols-7 gap-2">
        {DAYS.map((day, index) => {
          const session = sessionsByWeekday[index];
          const isSelectable = session && session.session_type !== "rest";
          const isSelected = session && session.id === selectedId;

          return (
            <div key={day} className="flex flex-col items-center gap-1.5">
              <span className="text-xs text-fog">{day}</span>
              <button
                type="button"
                disabled={!isSelectable}
                onClick={() =>
                  setSelectedId((current) => (current === session!.id ? null : session!.id))
                }
                className={`h-10 w-10 rounded-full border flex items-center justify-center text-[10px] font-semibold transition-opacity disabled:cursor-default ${
                  isSelectable ? "cursor-pointer" : ""
                } ${isSelected ? "ring-2 ring-paper/50" : ""} ${
                  session ? SESSION_TYPE_CIRCLE_CLASS[session.session_type] : "border-fog/25"
                } ${session?.status === "skipped" ? "opacity-40" : ""}`}
                title={session ? SESSION_TYPE_LABEL[session.session_type] : undefined}
              >
                {session
                  ? session.status === "done"
                    ? "✓"
                    : SESSION_TYPE_LABEL[session.session_type][0]
                  : ""}
              </button>
              {session?.planned_tss != null && (
                <span className="metric text-[10px] text-fog">{session.planned_tss}</span>
              )}
              {session && GARMIN_ELIGIBLE_SESSION_TYPES.has(session.session_type) && (
                <SendToGarminButton plannedSessionId={session.id} />
              )}
            </div>
          );
        })}
      </div>
      {sessions.length === 0 && (
        <p className="text-sm text-fog mt-3">Aún no hay sesiones planificadas.</p>
      )}
      {selectedSession && (
        <PlannedSessionActions session={selectedSession} weekSessions={sessions} today={today} />
      )}
    </div>
  );
}
