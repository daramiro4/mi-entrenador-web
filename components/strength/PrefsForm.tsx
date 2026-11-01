"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { MultiChoice, SingleChoice } from "@/components/ui/Choice";
import { savePrefsAction } from "@/app/fuerza/actions";
import { AREA_LABEL, EQUIPMENT_LABEL } from "@/lib/strength/labels";
import type { Contraindication, Equipment } from "@/lib/strength/types";
import type { Prefs } from "@/lib/strength/workout-types";

const toOptions = <T extends string>(labels: Record<T, string>) =>
  (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }));

/** Cuestionario inicial de preferencias y molestias. */
export function PrefsForm({ initial, onDone }: { initial: Prefs; onDone?: () => void }) {
  const [prefs, setPrefs] = useState<Prefs>(initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function submit() {
    start(async () => {
      const r = await savePrefsAction(prefs);
      setMsg(r.ok ? "Preferencias guardadas." : (r.error ?? "No se pudo guardar."));
      if (r.ok) onDone?.();
    });
  }

  return (
    <form
      className="grid gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <fieldset className="grid gap-2">
        <legend className="mb-1 text-sm font-medium">Días de fuerza por semana</legend>
        <SingleChoice name="Días por semana" value={prefs.days_per_week} onChange={(v) => setPrefs({ ...prefs, days_per_week: v })}
          options={[1, 2, 3, 4].map((n) => ({ value: n, label: String(n) }))} />
      </fieldset>
      <fieldset className="grid gap-2">
        <legend className="mb-1 text-sm font-medium">Minutos por sesión</legend>
        <SingleChoice name="Minutos por sesión" value={prefs.session_minutes} onChange={(v) => setPrefs({ ...prefs, session_minutes: v })}
          options={[20, 30, 45, 60].map((n) => ({ value: n, label: `${n} min` }))} />
      </fieldset>
      <fieldset className="grid gap-2">
        <legend className="mb-1 text-sm font-medium">Equipamiento disponible</legend>
        <MultiChoice<Equipment> name="Equipamiento" values={prefs.equipment}
          onChange={(v) => setPrefs({ ...prefs, equipment: v.includes("bodyweight") ? v : ["bodyweight", ...v] })}
          options={toOptions(EQUIPMENT_LABEL)} />
      </fieldset>
      <fieldset className="grid gap-2">
        <legend className="mb-1 text-sm font-medium">Nivel</legend>
        <SingleChoice name="Nivel" value={prefs.level} onChange={(v) => setPrefs({ ...prefs, level: v as 1 | 2 | 3 })}
          options={[{ value: 1, label: "Iniciación" }, { value: 2, label: "Intermedio" }, { value: 3, label: "Avanzado" }]} />
      </fieldset>
      <fieldset className="grid gap-2">
        <legend className="mb-1 text-sm font-medium">Molestias o limitaciones</legend>
        <MultiChoice<Contraindication> name="Limitaciones" values={prefs.limitations}
          onChange={(v) => setPrefs({ ...prefs, limitations: v })} options={toOptions(AREA_LABEL)} />
      </fieldset>
      {prefs.excluded_areas.length > 0 && (
        <fieldset className="grid gap-2">
          <legend className="mb-1 text-sm font-medium">Zonas excluidas por molestias recientes</legend>
          <p className="text-xs text-label-2">Desmárcalas cuando ya no te molesten para volver a incluirlas.</p>
          <MultiChoice<Contraindication> name="Zonas excluidas" values={prefs.excluded_areas}
            onChange={(v) => setPrefs({ ...prefs, excluded_areas: v })}
            options={prefs.excluded_areas.map((a) => ({ value: a, label: AREA_LABEL[a] }))} />
        </fieldset>
      )}
      <p className="text-xs text-label-2">
        Esta app no sustituye a un profesional. Si notas dolor que persiste, consulta con un fisioterapeuta.
      </p>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>{pending ? "Guardando…" : "Guardar preferencias"}</Button>
        <span role="status" className="text-sm text-label-2">{msg}</span>
      </div>
    </form>
  );
}
