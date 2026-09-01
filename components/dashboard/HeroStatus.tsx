import { FatigueRing } from "@/components/fatigue-ring/FatigueRing";
import { PLANNED_SESSION_STATUS_LABEL, SESSION_TYPE_LABEL } from "@/lib/labels";
import type { FatigueIndexRow, FatigueRecommendation, PlannedSession } from "@/lib/types";

function todaySubtitle(session: PlannedSession): string {
  if (session.status === "done" || session.status === "skipped") {
    return PLANNED_SESSION_STATUS_LABEL[session.status];
  }
  if (session.session_type === "rest") {
    return "Día de descanso.";
  }
  if (session.planned_tss != null) {
    return `Objetivo: ${session.planned_tss} TSS.`;
  }
  return "";
}

export function HeroStatus({
  fatigueIndex,
  todaySession,
}: {
  fatigueIndex: FatigueIndexRow | null;
  todaySession: PlannedSession | null;
}) {
  return (
    <div className="data-surface rounded-sm p-6 flex flex-col sm:flex-row items-center gap-6">
      <FatigueRing
        acwrRatio={fatigueIndex?.acwr_ratio ?? null}
        recommendation={(fatigueIndex?.recommendation as FatigueRecommendation | null) ?? null}
        notes={fatigueIndex?.notes ?? null}
      />
      <div className="text-center sm:text-left">
        <p className="text-fog text-sm uppercase tracking-wide">Hoy</p>
        <p className="font-display text-3xl uppercase tracking-wide text-paper leading-tight mt-1">
          {todaySession ? SESSION_TYPE_LABEL[todaySession.session_type] : "Sin sesión programada"}
        </p>
        <p className="text-fog text-sm mt-1">
          {todaySession
            ? todaySubtitle(todaySession)
            : "El plan de entrenamiento llega en la próxima fase."}
        </p>
      </div>
    </div>
  );
}
