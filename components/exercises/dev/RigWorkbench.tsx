"use client";

import { useRef, useState } from "react";
import { evalRig, muscleOpacityAt, normalizePoses, phaseIndexAt } from "@/lib/exercises/rig/interpolate";
import { validateRig } from "@/lib/exercises/rig/validate";
import type { Rig, Vec } from "@/lib/exercises/rig/types";
import { VIEWBOX } from "@/lib/exercises/rig/types";
import { RigStage } from "../RigStage";

/**
 * Herramienta de desarrollo (/dev/rigs, no existe en producción): previsualizar un rig, arrastrar articulaciones de una pose,
 * marcar escorzos, validar en vivo (±8 % de longitud de hueso) y exportar el JSON.
 */
export function RigWorkbench({ rigs }: { rigs: Rig[] }) {
  const [index, setIndex] = useState(0);
  const [edited, setEdited] = useState<Record<string, Rig>>({});
  const rig = edited[rigs[index].id] ?? rigs[index];
  const [mode, setMode] = useState<"pose" | "time">("time");
  const [poseIdx, setPoseIdx] = useState(0);
  const [t, setT] = useState(0.5);
  const [mirror, setMirror] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [dragName, setDragName] = useState<string | null>(null);

  const full = normalizePoses(rig.poses);
  const poseCount = full.length;
  const safePose = Math.min(poseIdx, poseCount - 1);
  const joints = mode === "pose" ? full[safePose].joints : evalRig(rig, t);
  const shownT = mode === "pose" ? full[safePose].t : t;
  const validation = validateRig(rig);

  const update = (next: Rig) => setEdited((e) => ({ ...e, [next.id]: next }));

  const toViewBox = (ev: React.PointerEvent): Vec => {
    const svg = wrapRef.current!.querySelector("svg")!;
    const pt = svg.createSVGPoint();
    pt.x = ev.clientX;
    pt.y = ev.clientY;
    const m = svg.getScreenCTM()!.inverse();
    const p = pt.matrixTransform(m);
    return [Math.round(Math.min(VIEWBOX.width, Math.max(0, mirror ? VIEWBOX.width - p.x : p.x)) * 10) / 10, Math.round(Math.min(VIEWBOX.height, Math.max(0, p.y)) * 10) / 10];
  };

  const onMove = (ev: React.PointerEvent) => {
    const name = dragName;
    if (!name || mode !== "pose") return;
    const v = toViewBox(ev);
    const sorted = [...rig.poses].sort((a, b) => a.t - b.t);
    const target = sorted[safePose];
    const poses = rig.poses.map((p) => (p === target ? { ...p, joints: { ...p.joints, [name]: v } } : p));
    update({ ...rig, poses });
  };

  const toggleForeshortened = (id: string) =>
    update({ ...rig, bones: rig.bones.map((b) => (b.id === id ? { ...b, foreshortened: !b.foreshortened } : b)) });

  const json = JSON.stringify(rig, null, 1);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <div className="data-surface">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <select
            aria-label="Rig"
            value={index}
            onChange={(e) => { setIndex(Number(e.target.value)); setPoseIdx(0); }}
            className="min-h-11 rounded-[12px] border border-separator bg-surface-2 px-3 text-sm"
          >
            {rigs.map((r, i) => (
              <option key={r.id} value={i}>{r.id}</option>
            ))}
          </select>
          <div role="group" aria-label="Modo" className="inline-flex rounded-full bg-fill p-1">
            {(["time", "pose"] as const).map((m) => (
              <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)} className={`min-h-11 rounded-full px-4 text-sm ${mode === m ? "bg-surface-2 text-label" : "text-label-2"}`}>
                {m === "time" ? "Reproducir (t)" : "Editar pose"}
              </button>
            ))}
          </div>
          <label className="inline-flex min-h-11 items-center gap-2 text-sm text-label-2">
            <input type="checkbox" checked={mirror} onChange={(e) => setMirror(e.target.checked)} /> Espejo
          </label>
        </div>

        <div ref={wrapRef} onPointerMove={onMove}>
        <RigStage
          rig={rig}
          joints={joints}
          muscleOpacity={muscleOpacityAt(rig.phases, shownT)}
          mirror={mirror}
          label={`${rig.title_es} en t=${shownT.toFixed(2)}`}
          className="h-auto w-full touch-none"
        >
          {mode === "pose" &&
            Object.entries(joints).map(([name, [x, y]]) => (
              <circle
                key={name}
                cx={x}
                cy={y}
                r={7}
                fill="var(--accent)"
                fillOpacity={0.85}
                stroke="var(--bg)"
                strokeWidth={2}
                className="cursor-grab"
                onPointerDown={(ev) => { setDragName(name); (ev.target as Element).setPointerCapture(ev.pointerId); }}
                onPointerUp={() => setDragName(null)}
              >
                <title>{name}</title>
              </circle>
            ))}
        </RigStage>
        </div>

        {mode === "time" ? (
          <label className="mt-3 flex items-center gap-3 text-sm text-label-2">
            t
            <input type="range" min={0} max={1} step={0.005} value={t} onChange={(e) => setT(Number(e.target.value))} className="flex-1" />
            <span className="w-16 font-mono text-label">{t.toFixed(3)}</span>
          </label>
        ) : (
          <label className="mt-3 flex items-center gap-3 text-sm text-label-2">
            Pose
            <input type="range" min={0} max={poseCount - 1} step={1} value={safePose} onChange={(e) => setPoseIdx(Number(e.target.value))} className="flex-1" />
            <span className="w-28 font-mono text-label">{safePose + 1}/{poseCount} · t={full[safePose].t.toFixed(3)}</span>
          </label>
        )}
        <p className="mt-2 text-sm text-label-2">
          Fase: <span className="text-label">{rig.phases[phaseIndexAt(rig.phases, shownT)]?.label_es}</span>
        </p>
      </div>

      <div className="space-y-4">
        <div className="data-surface">
          <h2 className="text-lg">Validación {validation.ok ? "· OK" : "· CON ERRORES"}</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {validation.issues.length === 0 && <li className="text-label-2">Sin avisos.</li>}
            {validation.issues.map((i, k) => (
              <li key={k} className={i.level === "error" ? "text-danger" : "text-label-2"}>
                {i.level === "error" ? "Error" : "Aviso"}: {i.message}
              </li>
            ))}
          </ul>
          <h3 className="mt-4 text-base">Huesos (cambio máx. de longitud)</h3>
          <ul className="mt-1 space-y-0.5 text-sm">
            {rig.bones.filter((b) => b.kind !== "head").map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-2">
                <label className="inline-flex min-h-8 items-center gap-2">
                  <input type="checkbox" checked={!!b.foreshortened} onChange={() => toggleForeshortened(b.id)} />
                  <span className="font-mono">{b.id}</span>
                </label>
                <span className={`font-mono ${(validation.maxBoneChange[b.id] ?? 0) > 0.08 && !b.foreshortened ? "text-danger" : "text-label-2"}`}>
                  {((validation.maxBoneChange[b.id] ?? 0) * 100).toFixed(1)} %
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-label-2">Marca «escorzo» solo en los huesos cuyo movimiento sale del plano.</p>
        </div>
        <div className="data-surface">
          <div className="flex items-center justify-between">
            <h2 className="text-lg">Exportar JSON</h2>
            <button type="button" onClick={() => navigator.clipboard?.writeText(json)} className="inline-flex min-h-11 items-center rounded-full bg-surface-2 px-4 text-sm">Copiar</button>
          </div>
          <textarea readOnly value={json} aria-label="JSON del rig" className="mt-2 h-48 w-full rounded-[12px] border border-separator bg-bg p-2 font-mono text-xs" />
          <button type="button" onClick={() => setEdited((e) => { const c = { ...e }; delete c[rig.id]; return c; })} className="mt-2 inline-flex min-h-11 items-center rounded-full px-3 text-sm text-label-2 hover:text-label">
            Deshacer cambios de este rig
          </button>
        </div>
      </div>
    </div>
  );
}

