"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { DAY_STATE_LABEL, dayState, type DayState } from "@/lib/dashboard-stats";
import { addDays, getWeekdayIndex } from "@/lib/week";
import type { ActivityRow, PlannedSession, SessionType, StrengthSessionRow } from "@/lib/types";
import { PlannedSessionActions } from "./PlannedSessionActions";

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const TYPE_SHORT: Record<SessionType, string> = { quality: "CAL", z2: "Z2", strength: "FZA", rest: "—" };
const STATE_TEXT: Partial<Record<DayState, string>> = {
  done: "Hecha",
  today: "Hoy",
  pending: "Prevista",
  rest: "Descanso",
  degraded: "Adaptada",
  skipped: "Saltada",
};

/** "Esta semana": 7 celdas Lun–Dom (nombre, TSS, estado) y, al tocar una, sus acciones. */
export function WeeklyStrip({
  sessions,
  activities,
  strengthSessions,
  today,
  header,
  weekStartDate,
  emptyMessage = "Aún no hay plan: se generará con el motor de entrenamiento.",
}: {
  sessions: PlannedSession[];
  activities: ActivityRow[];
  strengthSessions: StrengthSessionRow[];
  today: string;
  header?: ReactNode;
  weekStartDate: string;
  emptyMessage?: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const sessionsByWeekday = new Array<PlannedSession | undefined>(7);
  for (const session of sessions) {
    sessionsByWeekday[getWeekdayIndex(session.date)] = session;
  }

  const selectedSession = sessions.find((s) => s.id === selectedId) ?? null;

  return (
    <div id="plan" className="data-surface scroll-mt-20">
      {header}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {DAYS.map((day, index) => {
          const session = sessionsByWeekday[index];
          const date = addDays(weekStartDate, index);
          const state = dayState(session, date, today);
          const isToday = state === "today" || date === today;
          const isSelectable = !!session && session.session_type !== "rest";
          const isSelected = !!session && session.id === selectedId;
          const stateText = DAY_STATE_LABEL[state];

          return (
            <button
              key={day}
              type="button"
              disabled={!isSelectable}
              aria-pressed={isSelectable ? isSelected : undefined}
              aria-label={`${day}${session ? `, ${TYPE_SHORT[session.session_type] === "—" ? "descanso" : TYPE_SHORT[session.session_type]}` : ""}${session?.planned_tss != null ? `, ${session.planned_tss} TSS` : ""}, ${stateText}`}
              onClick={() => setSelectedId((current) => (current === session!.id ? null : session!.id))}
              className={`flex min-h-[92px] flex-col items-center justify-between rounded-[12px] border px-1 py-2 text-center transition-colors disabled:cursor-default ${
                isToday ? "border-label" : "border-separator"
              } ${isSelected ? "bg-surface-2" : "bg-transparent"} ${isSelectable ? "cursor-pointer hover:bg-surface-2" : ""} ${
                state === "skipped" ? "opacity-50" : ""
              }`}
            >
              <span className="flex items-center gap-1 font-mono text-[11px] uppercase text-label-2">
                {isToday && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-volt" />}
                {day}
              </span>
              <span className="font-mono text-[11px] text-label-2">{session ? TYPE_SHORT[session.session_type] : ""}</span>
              <span className="font-mono text-sm text-label">{session?.planned_tss ?? "—"}</span>
              <span className="flex min-h-5 items-center justify-center text-[11px] text-label-2">
                {state === "done" ? (
                  <Check size={16} strokeWidth={2.5} aria-hidden="true" className="text-accent" />
                ) : (
                  <span className="hidden sm:inline">{STATE_TEXT[state] ?? ""}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>
      {sessions.length === 0 && <p className="mt-3 text-sm text-label-2">{emptyMessage}</p>}
      {selectedSession && (
        <div className="mt-4">
          <PlannedSessionActions
            session={selectedSession}
            weekSessions={sessions}
            activities={activities}
            strengthSessions={strengthSessions}
            today={today}
          />
        </div>
      )}
    </div>
  );
}
