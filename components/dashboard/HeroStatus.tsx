import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { LinkButton } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { SyncGarminButton } from "@/components/dashboard/SyncGarminButton";
import { ExtraSessionButton } from "@/components/dashboard/ExtraSessionButton";
import { PLANNED_SESSION_STATUS_LABEL, SESSION_TYPE_LABEL } from "@/lib/labels";
import type { PlannedSession } from "@/lib/types";

const SESSION_TITLE = {
  quality: "Sesión de calidad",
  z2: "Rodaje suave en Z2",
  strength: "Fuerza",
  rest: "Día de descanso",
} as const;

/** Sesión de hoy: tipo, título, duración, TSS previsto, dónde, acción principal. */
export function HeroStatus({ todaySession }: { todaySession: PlannedSession | null }) {
  const notes = todaySession?.notes as { duration_minutes?: number } | null;
  const where = todaySession
    ? todaySession.session_type === "strength"
      ? "Gimnasio"
      : todaySession.session_type === "rest"
        ? null
        : "Bici / rodillo"
    : null;

  return (
    <GlassCard aria-labelledby="hoy-title">
      <div className="flex items-center gap-2 text-sm text-label-2">
        <CalendarCheck size={18} strokeWidth={1.75} aria-hidden="true" />
        <h2 id="hoy-title" className="font-medium">Sesión de hoy</h2>
      </div>
      {todaySession ? (
        <>
          <p className="mt-3 text-3xl font-semibold leading-tight" style={{ letterSpacing: "-0.025em" }}>
            {SESSION_TITLE[todaySession.session_type]}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Chip tone="accent">{SESSION_TYPE_LABEL[todaySession.session_type]}</Chip>
            <Chip>{PLANNED_SESSION_STATUS_LABEL[todaySession.status]}</Chip>
            {notes?.duration_minutes != null && <Chip>{notes.duration_minutes} min</Chip>}
            {todaySession.planned_tss != null && <Chip>{todaySession.planned_tss} TSS</Chip>}
            {where && <Chip>{where}</Chip>}
          </div>
        </>
      ) : (
        <p className="mt-3 text-lg text-label-2">Sin sesión programada para hoy.</p>
      )}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {todaySession?.session_type === "strength" ? (
          <LinkButton href="/fuerza">Ir a Fuerza</LinkButton>
        ) : todaySession && todaySession.session_type !== "rest" ? (
          <LinkButton href="/dashboard#plan">Ver en el plan</LinkButton>
        ) : (
          <LinkButton href="/fuerza">Entrenar fuerza</LinkButton>
        )}
        <SyncGarminButton />
        <ExtraSessionButton />
      </div>
      <p className="mt-3 text-xs text-label-2">
        <Link href="/workouts" className="text-accent">Plantillas de entreno</Link>
      </p>
    </GlassCard>
  );
}
