import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { LinkButton } from "@/components/ui/Button";
import { SyncGarminButton } from "@/components/dashboard/SyncGarminButton";
import { ExtraSessionButton } from "@/components/dashboard/ExtraSessionButton";
import { SendToGarminButton } from "@/components/dashboard/SendToGarminButton";
import { PlannedSessionActions } from "@/components/dashboard/PlannedSessionActions";
import { PLANNED_SESSION_STATUS_LABEL } from "@/lib/labels";
import { SESSION_STRUCTURE } from "@/lib/dashboard-v2";
import type { ActivityRow, PlannedSession, StrengthSessionRow } from "@/lib/types";

const SESSION_TITLE = {
  quality: "Sesión de calidad",
  z2: "Rodaje suave en Z2",
  strength: "Fuerza",
  rest: "Día de descanso",
} as const;

export interface PowerInfo {
  pctLow: number;
  pctHigh: number;
  wattsLow: number | null;
  wattsHigh: number | null;
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-separator px-3 py-1 font-mono text-xs text-label">
      {children}
    </span>
  );
}

/** Hero b): sesión de hoy con estructura, adaptación y acciones. Un solo botón primario (Ember). */
export function TodaySessionCard({
  todaySession,
  weekSessions,
  activities,
  strengthSessions,
  today,
  adaptation,
  power,
}: {
  todaySession: PlannedSession | null;
  weekSessions: PlannedSession[];
  activities: ActivityRow[];
  strengthSessions: StrengthSessionRow[];
  today: string;
  adaptation: string | null;
  power: PowerInfo | null;
}) {
  const notes = todaySession?.notes as { duration_minutes?: number } | null;
  const type = todaySession?.session_type ?? null;
  const open = todaySession != null && (todaySession.status === "planned" || todaySession.status === "degraded");
  const structure = type ? SESSION_STRUCTURE[type] : [];

  return (
    <GlassCard aria-labelledby="hoy-title" className="flex flex-col">
      <h2 id="hoy-title" className="text-xl">Sesión de hoy</h2>
      {todaySession ? (
        <>
          <p className="mt-3 font-display text-[40px] font-extrabold leading-none sm:text-5xl">{SESSION_TITLE[todaySession.session_type]}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Pill>{PLANNED_SESSION_STATUS_LABEL[todaySession.status]}</Pill>
            {notes?.duration_minutes != null && <Pill>{notes.duration_minutes} min</Pill>}
            {todaySession.planned_tss != null && <Pill>{todaySession.planned_tss} TSS</Pill>}
            {power && <Pill>{power.pctLow}–{power.pctHigh} % FTP</Pill>}
            {power?.wattsLow != null && <Pill>{power.wattsLow}–{power.wattsHigh} W</Pill>}
          </div>
          {structure.length > 0 && (
            <div className="mt-5">
              <div className="flex h-2.5 w-full gap-1" role="img" aria-label={`Estructura orientativa: ${structure.map((s) => `${s.label} ${s.pct} %`).join(", ")}`}>
                {structure.map((s) => (
                  <div
                    key={s.label}
                    className={`h-full rounded-full ${s.label === "Bloque principal" ? "bg-volt" : "bg-fill"}`}
                    style={{ width: `${s.pct}%` }}
                  />
                ))}
              </div>
              <div className="mt-1.5 flex w-full gap-1 text-[11px] text-label-2" aria-hidden="true">
                {structure.map((s) => (
                  <span key={s.label} style={{ width: `${s.pct}%` }} className="truncate">
                    {s.label === "Bloque principal" ? "Principal" : s.label === "Calentamiento" ? "Calent." : "Calma"}
                  </span>
                ))}
              </div>
            </div>
          )}
          {adaptation && (
            <p className="mt-4 flex items-start gap-2 text-sm text-label-2">
              <span aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-volt" />
              {adaptation}
            </p>
          )}
        </>
      ) : (
        <p className="mt-3 text-lg text-label-2">Sin sesión programada para hoy.</p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {type === "strength" ? (
          <LinkButton href="/fuerza">Ir a Fuerza</LinkButton>
        ) : open && (type === "z2" || type === "quality") ? (
          <SendToGarminButton plannedSessionId={todaySession!.id} variant="primary" />
        ) : !todaySession || type === "rest" ? (
          <LinkButton href="/fuerza">Entrenar fuerza</LinkButton>
        ) : null}
      </div>
      {todaySession && type !== "rest" && (
        <div className="mt-3">
          <PlannedSessionActions
            session={todaySession}
            weekSessions={weekSessions}
            activities={activities}
            strengthSessions={strengthSessions}
            today={today}
            embedded
            showSend={false}
          />
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-separator pt-4">
        <SyncGarminButton />
        <ExtraSessionButton />
        <Link href="/workouts" className="inline-flex min-h-11 items-center px-3 text-sm text-accent">
          Plantillas de entreno
        </Link>
      </div>
    </GlassCard>
  );
}
