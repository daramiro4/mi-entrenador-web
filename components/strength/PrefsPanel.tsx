"use client";

import { useState } from "react";
import { Settings2 } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { PrefsForm } from "./PrefsForm";
import type { Prefs } from "@/lib/strength/workout-types";

/** Preferencias desplegables (tras el cuestionario inicial). */
export function PrefsPanel({ prefs }: { prefs: Prefs }) {
  const [open, setOpen] = useState(false);
  return (
    <GlassCard aria-labelledby="pf-title">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open}
        className="flex min-h-11 w-full items-center justify-between text-left">
        <span className="flex items-center gap-2">
          <Settings2 size={20} strokeWidth={1.75} aria-hidden="true" />
          <span id="pf-title" className="text-lg font-semibold">Preferencias y molestias</span>
        </span>
        <span className="text-sm text-accent">{open ? "Cerrar" : "Editar"}</span>
      </button>
      {open && <div className="mt-4"><PrefsForm initial={prefs} onDone={() => setOpen(false)} /></div>}
    </GlassCard>
  );
}
