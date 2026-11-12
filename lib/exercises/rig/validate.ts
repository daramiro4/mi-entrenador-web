import { evalPose, normalizePoses } from "./interpolate";
import { GROUND_Y, MAX_BONE_CHANGE, VIEWBOX, type Rig, type RigIssue, type Vec } from "./types";

const dist = (a: Vec, b: Vec): number => Math.hypot(a[0] - b[0], a[1] - b[1]);
const EPS = 1e-6;

/** Resultado de validar un rig: los `error` impiden publicarlo; los `warning` son avisos. */
export function validateRig(rig: Rig): { ok: boolean; issues: RigIssue[]; maxBoneChange: Record<string, number> } {
  const issues: RigIssue[] = [];
  const err = (message: string) => issues.push({ level: "error", message });
  const warn = (message: string) => issues.push({ level: "warning", message });

  if (rig.poses.length < 2) err("Hacen falta al menos 2 poses.");
  if (rig.loop_ms < 4000 || rig.loop_ms > 8000) err(`loop_ms=${rig.loop_ms} fuera de 4000-8000.`);

  const times = rig.poses.map((p) => p.t);
  if (times.some((t, i) => i > 0 && t <= times[i - 1])) err("Los instantes t de las poses deben ser estrictamente crecientes.");
  if (rig.poses[0] && Math.abs(rig.poses[0].t) > EPS) err("La primera pose debe estar en t=0.");
  if (rig.poses.length && Math.abs(rig.poses[rig.poses.length - 1].t - 1) > EPS) err("La última pose debe estar en t=1.");
  if (rig.poses.length < 2) return { ok: false, issues, maxBoneChange: {} };

  const full = normalizePoses(rig.poses);
  const joints = Object.keys(full[0].joints);
  const jointSet = new Set(joints);

  // Huesos e implementos referencian articulaciones que existen.
  for (const b of rig.bones) {
    if (!jointSet.has(b.a)) err(`Hueso ${b.id}: articulación inexistente "${b.a}".`);
    if (!b.kind || b.kind !== "head") if (!jointSet.has(b.b)) err(`Hueso ${b.id}: articulación inexistente "${b.b}".`);
  }
  for (const m of rig.markers ?? []) if (!jointSet.has(m)) err(`Marcador: articulación inexistente "${m}".`);
  for (const imp of rig.implements ?? []) if (imp.at && !jointSet.has(imp.at)) err(`Implemento ${imp.kind}: articulación inexistente "${imp.at}".`);
  for (const [a, b] of rig.highlight?.segments.map((s) => [s[0], s[1]] as const) ?? []) {
    if (!jointSet.has(a) || !jointSet.has(b)) err(`Resalte: articulación inexistente (${a}, ${b}).`);
  }

  // Bucle cerrado: la última pose debe coincidir con la primera (si no, hay un salto al repetir).
  const first = full[0].joints;
  const last = full[full.length - 1].joints;
  const loopGap = Math.max(...joints.map((j) => dist(first[j], last[j])));
  if (loopGap > 1) err(`El bucle no cierra: la última pose difiere ${loopGap.toFixed(1)} px de la primera.`);

  // Dentro del lienzo y sin atravesar el suelo (tolerancia de 4 px para el apoyo).
  for (const pose of full) {
    for (const [name, [x, y]] of Object.entries(pose.joints)) {
      if (x < 0 || x > VIEWBOX.width || y < 0 || y > VIEWBOX.height) err(`t=${pose.t}: "${name}" fuera del lienzo (${x.toFixed(0)}, ${y.toFixed(0)}).`);
      else if (y > GROUND_Y + 4) warn(`t=${pose.t}: "${name}" bajo el suelo (y=${y.toFixed(0)} > ${GROUND_Y}).`);
    }
  }

  // Longitud de huesos: ±8 % respecto a la pose inicial, salvo escorzo marcado. Se mide también en poses intermedias del movimiento.
  const maxBoneChange: Record<string, number> = {};
  const samples = Array.from({ length: 81 }, (_, i) => evalPose(rig.poses, i / 80, rig.interpolation ?? "eased"));
  for (const bone of rig.bones) {
    if (bone.kind === "head") continue;
    if (!jointSet.has(bone.a) || !jointSet.has(bone.b)) continue; // ya reportado arriba
    const ref = dist(first[bone.a], first[bone.b]);
    if (ref < EPS) { err(`Hueso ${bone.id}: longitud 0 en la pose inicial.`); continue; }
    let worst = 0;
    for (const s of samples) worst = Math.max(worst, Math.abs(dist(s[bone.a], s[bone.b]) - ref) / ref);
    maxBoneChange[bone.id] = worst;
    if (worst > MAX_BONE_CHANGE) {
      const msg = `Hueso ${bone.id} (${bone.a}→${bone.b}) cambia ${(worst * 100).toFixed(1)} % de longitud (máx. ${(MAX_BONE_CHANGE * 100).toFixed(0)} %).`;
      if (bone.foreshortened) warn(`${msg} Permitido: marcado como escorzo.`);
      else err(`${msg} Márcalo como escorzo o corrige la pose.`);
    } else if (bone.foreshortened && worst < 0.01) {
      warn(`Hueso ${bone.id} está marcado como escorzo pero no cambia de longitud.`);
    }
  }

  // Fases: cubren 0..1 sin huecos ni solapes.
  if (rig.phases.length === 0) err("Faltan fases.");
  else {
    const sorted = [...rig.phases].sort((a, b) => a.from - b.from);
    if (Math.abs(sorted[0].from) > EPS) err("La primera fase debe empezar en 0.");
    if (Math.abs(sorted[sorted.length - 1].to - 1) > EPS) err("La última fase debe acabar en 1.");
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].to <= sorted[i].from) err(`Fase "${sorted[i].label_es}": to <= from.`);
      if (i > 0 && Math.abs(sorted[i].from - sorted[i - 1].to) > EPS) err(`Hueco o solape entre las fases "${sorted[i - 1].label_es}" y "${sorted[i].label_es}".`);
    }
  }
  return { ok: !issues.some((i) => i.level === "error"), issues, maxBoneChange };
}
