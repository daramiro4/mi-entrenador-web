"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Car } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { startAntidoteAction } from "@/app/fuerza/actions";

export function DrivingAntidoteCard() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <GlassCard aria-labelledby="ant-title">
      <div className="flex items-center gap-2">
        <Car size={20} strokeWidth={1.75} aria-hidden="true" />
        <h2 id="ant-title" className="text-lg font-semibold">Antídoto de conducción</h2>
      </div>
      <p className="mt-2 text-sm text-label-2">
        6 minutos de movilidad y activación para compensar las horas sentado: espalda, cadera, pecho, cuello y glúteos.
      </p>
      <div className="mt-4">
        <Button
          variant="secondary"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await startAntidoteAction();
              if (r.ok && r.id) router.push(`/fuerza/entreno/${r.id}`);
              else setError(r.error ?? "No se pudo empezar");
            })
          }
        >
          {pending ? "Preparando…" : "Empezar (6 min)"}
        </Button>
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
    </GlassCard>
  );
}
