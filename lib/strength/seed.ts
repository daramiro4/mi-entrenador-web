import { EXERCISES } from "./library";
import { FORMATS } from "./formats";

const q = (s: string) => `'${s.replace(/'/g, "''")}'`;
const arr = (a: string[]) => (a.length ? `array[${a.map(q).join(", ")}]::text[]` : "'{}'::text[]");
const json = (v: unknown) => `${q(JSON.stringify(v))}::jsonb`;

/** SQL idempotente (upsert por slug) para sembrar la biblioteca. Generado: no editar a mano. */
export function buildSeedSql(): string {
  const ex = EXERCISES.map(
    (e) =>
      `  (${[
        q(e.slug), q(e.name_es), q(e.pattern), arr(e.equipment), e.level, q(e.leg_load), arr(e.contraindications),
        arr(e.alternatives), arr(e.cues_es), q(e.common_error_es), q(e.garmin_category), q(e.garmin_exercise),
        json({ ...e.pose_a, labels: e.pose_labels }), json({ ...e.pose_b, labels: e.pose_labels }), e.unilateral,
      ].join(", ")})`
  ).join(",\n");
  // La tabla workout_formats no la lee la app (FORMATS vive en código) y la siembra aplicada no se reescribe:
  // "completa" no se refleja aquí; un cambio de base sería una migración nueva aparte.
  const fm = FORMATS.filter((f) => f.slug !== "completa").map((f) => `  (${q(f.slug)}, ${q(f.name_es)}, ${json(f.rules)})`).join(",\n");
  return `-- GENERADO por lib/strength/seed.ts (npm run seed:strength). No editar a mano.
-- Siembra idempotente de la biblioteca de fuerza. Solo inserta/actualiza filas de las tablas nuevas.
-- Rollback: delete from public.exercises where slug in (select slug from public.exercises); delete from public.workout_formats;

insert into public.exercises
  (slug, name_es, pattern, equipment, level, leg_load, contraindications, alternatives, cues_es, common_error_es, garmin_category, garmin_exercise, pose_a, pose_b, unilateral)
values
${ex}
on conflict (slug) do update set
  name_es = excluded.name_es, pattern = excluded.pattern, equipment = excluded.equipment, level = excluded.level,
  leg_load = excluded.leg_load, contraindications = excluded.contraindications, alternatives = excluded.alternatives,
  cues_es = excluded.cues_es, common_error_es = excluded.common_error_es, garmin_category = excluded.garmin_category,
  garmin_exercise = excluded.garmin_exercise, pose_a = excluded.pose_a, pose_b = excluded.pose_b, unilateral = excluded.unilateral;

insert into public.workout_formats (slug, name_es, rules)
values
${fm}
on conflict (slug) do update set name_es = excluded.name_es, rules = excluded.rules;
`;
}
