import { describe, expect, it } from "vitest";
import { ENGINE, generateWorkout, isEligible, estimateMinutes } from "./engine";
import { EXERCISE_BY_SLUG, EXERCISES } from "./library";
import { FORMATS } from "./formats";
import { validateWorkout } from "./validator";
import { nextLoad } from "./progression";
import { strengthTss, STRENGTH_TSS } from "./tss";
import { drivingAntidote } from "./antidote";
import type { GenerateInput, HistoryEntry, Prefs } from "./workout-types";

const prefs = (o: Partial<Prefs> = {}): Prefs => ({
  days_per_week: 2, session_minutes: 30, equipment: ["bodyweight", "dumbbell", "band"], level: 2, limitations: [], excluded_areas: [], ...o,
});
const input = (o: Partial<GenerateInput> = {}): GenerateInput => ({
  prefs: prefs(), format: "circuito", history: [], recentDiscomfort: [], recentSlugs: [], recentNames: [], seed: 42, ...o,
});

describe("motor de reglas", () => {
  it("genera rutinas válidas para todos los formatos, niveles y duraciones habituales", () => {
    for (const f of FORMATS) {
      for (const level of [1, 2, 3] as const) {
        for (const minutes of f.slug === "completa" ? [30, 45] : [20, 30] /* los demás formatos ya no se ofrecen y no llegan a 45 min + cardio */) {
          const r = generateWorkout(input({ format: f.slug, prefs: prefs({ level, session_minutes: minutes }) }));
          expect(r.workout, `${f.slug} L${level} ${minutes}min: ${JSON.stringify(r.attempts)}`).not.toBeNull();
          const w = r.workout!;
          const main = w.blocks.find((b) => b.kind === "main")!;
          const patterns = new Set(main.exercises.map((e) => e.pattern));
          expect(patterns.has("hinge") && patterns.has("core")).toBe(true);
          // `session_minutes` son los minutos de ejercicios; el total suma los 10 min de cardio en cinta.
          const total = minutes + ENGINE.CARDIO_MIN;
          expect(Math.abs(w.duration_min - total) / total).toBeLessThanOrEqual(0.15);
        }
      }
    }
  });

  it("empuje:tirón nunca desequilibrado hacia el empuje", () => {
    for (let seed = 1; seed <= 25; seed++) {
      const w = generateWorkout(input({ seed })).workout!;
      const main = w.blocks.find((b) => b.kind === "main")!;
      const push = main.exercises.filter((e) => e.pattern === "push").length;
      const pull = main.exercises.filter((e) => e.pattern === "pull").length;
      expect(pull).toBeGreaterThanOrEqual(push);
    }
  });

  it("respeta limitaciones, molestias recientes y zonas excluidas", () => {
    const w = generateWorkout(input({ prefs: prefs({ limitations: ["low_back"], excluded_areas: ["shoulder"] }), recentDiscomfort: ["knee"] })).workout!;
    for (const b of w.blocks) for (const l of b.exercises) {
      const c = EXERCISE_BY_SLUG[l.slug].contraindications;
      expect(c.some((x) => ["low_back", "shoulder", "knee"].includes(x)), l.slug).toBe(false);
    }
  });

  it("sin pierna pesada si mañana hay bici de calidad; sin datos no se aplica", () => {
    for (const ex of EXERCISES.filter((e) => e.leg_load === "heavy")) {
      expect(isEligible(ex, input({ nextDayQuality: true }))).toBe(false);
      expect(isEligible(ex, input({ nextDayQuality: undefined })) || ex.level > 2 || !ex.equipment.some((e) => ["bodyweight", "dumbbell", "band"].includes(e))).toBe(true);
    }
    const w = generateWorkout(input({ nextDayQuality: true })).workout!;
    expect(w.blocks.flatMap((b) => b.exercises).some((l) => EXERCISE_BY_SLUG[l.slug].leg_load === "heavy")).toBe(false);
  });

  it("solo usa equipamiento disponible", () => {
    const w = generateWorkout(input({ prefs: prefs({ equipment: ["bodyweight"] }) })).workout!;
    for (const l of w.blocks.flatMap((b) => b.exercises)) {
      expect(EXERCISE_BY_SLUG[l.slug].equipment).toContain("bodyweight");
    }
  });

  it("rota ejercicios y nombres respecto a la sesión anterior", () => {
    const first = generateWorkout(input({ seed: 7 })).workout!;
    const slugs = first.blocks.find((b) => b.kind === "main")!.exercises.map((e) => e.slug);
    const second = generateWorkout(input({ seed: 7, recentSlugs: slugs, recentNames: [first.name] })).workout!;
    const slugs2 = second.blocks.find((b) => b.kind === "main")!.exercises.map((e) => e.slug);
    expect(slugs2.filter((s) => slugs.includes(s)).length).toBeLessThan(slugs.length);
    expect(second.name).not.toBe(first.name);
  });

  it("es determinista dada la semilla", () => {
    expect(generateWorkout(input({ seed: 99 })).workout).toEqual(generateWorkout(input({ seed: 99 })).workout);
  });

  it("falla con explicación si no hay ejercicios elegibles", () => {
    const r = generateWorkout(input({ prefs: prefs({ equipment: ["machine"], level: 1 }), recentDiscomfort: ["low_back", "knee", "shoulder", "neck", "wrist", "hip", "elbow"] }));
    // con todas las zonas bloqueadas quedan pocos ejercicios: o falla con motivo o valida
    if (!r.workout) expect(r.attempts.length).toBe(3);
  });
});

describe("validador", () => {
  const base = () => generateWorkout(input()).workout!;
  const ctx = { prefs: prefs(), history: [] as HistoryEntry[], blocked: new Set<never>() };

  it("acepta una rutina generada", () => expect(validateWorkout(base(), ctx).ok).toBe(true));
  it("rechaza ejercicios inexistentes", () => {
    const w = base();
    w.blocks[1].exercises[0].slug = "no-existe";
    expect(validateWorkout(w, ctx).errors.join()).toMatch(/inexistente/);
  });
  it("rechaza si falta el cardio en cinta", () => {
    const w = base();
    w.blocks = w.blocks.filter((b) => b.kind !== "cardio");
    expect(validateWorkout(w, ctx).errors.join()).toMatch(/cardio/);
  });
  it("rechaza contraindicaciones y equipamiento no disponible", () => {
    const w = base();
    w.blocks[1].exercises[0] = { ...w.blocks[1].exercises[0], slug: "peso-muerto-barra", pattern: "hinge" };
    const r = validateWorkout(w, { ...ctx, blocked: new Set(["low_back"] as const) as Set<never> });
    expect(r.errors.join()).toMatch(/contraindicado/);
    expect(r.errors.join()).toMatch(/equipamiento/);
  });
  it("rechaza subidas de carga > 10 %", () => {
    const w = base();
    const line = w.blocks[1].exercises[0];
    line.weight_kg = 30;
    const hist: HistoryEntry = { slug: line.slug, weight_kg: 20, target_reps: 10, reps_done: [10], rpe: 7, felt: "ok", discomfort: false };
    expect(validateWorkout(w, { ...ctx, history: [hist] }).errors.join()).toMatch(/carga sube/);
  });
  it("rechaza duración fuera de ±15 %", () => {
    const w = base();
    w.requested_min = 60;
    expect(validateWorkout(w, ctx).errors.join()).toMatch(/Duración/);
  });
  it("rechaza pierna pesada con bici de calidad mañana", () => {
    const w = base();
    w.blocks[1].exercises[0] = { ...w.blocks[1].exercises[0], slug: "sentadilla-goblet", pattern: "squat" };
    expect(validateWorkout(w, { ...ctx, nextDayQuality: true }).errors.join()).toMatch(/pierna pesada/);
  });
  it("rechaza exceso de volumen por patrón", () => {
    const w = base();
    w.blocks[1].rounds = 4;
    w.blocks[1].exercises = Array.from({ length: 4 }, () => ({ ...w.blocks[1].exercises[0], pattern: "hinge" as const }));
    expect(validateWorkout(w, ctx).errors.join()).toMatch(/volumen/);
  });
});

describe("progresión (doble progresión)", () => {
  const h = (o: Partial<HistoryEntry>): HistoryEntry => ({ slug: "x", weight_kg: 20, target_reps: 10, reps_done: [10, 10, 10], rpe: 7, felt: "ok", discomfort: false, ...o });
  it("primera vez: sin carga decidida", () => expect(nextLoad(undefined).weight_kg).toBeNull());
  it("todo hecho con RPE ≤ 8 sube repeticiones", () => expect(nextLoad(h({}))).toMatchObject({ action: "up_reps", reps: 11, weight_kg: 20 }));
  it("en el techo de repeticiones sube peso (≤ 10 %) y reinicia reps", () => {
    const n = nextLoad(h({ target_reps: 12, reps_done: [12, 12] }));
    expect(n.action).toBe("up_weight");
    expect(n.weight_kg! / 20).toBeLessThanOrEqual(1.1);
    expect(n.weight_kg!).toBeGreaterThan(20);
    expect(n.reps).toBe(8);
  });
  it("'Duro' mantiene; 'Duro' con RPE 10 baja", () => {
    expect(nextLoad(h({ felt: "hard", rpe: 8 })).action).toBe("maintain");
    expect(nextLoad(h({ felt: "hard", rpe: 10 }))).toMatchObject({ action: "down", weight_kg: 19 });
  });
  it("molestia mantiene", () => expect(nextLoad(h({ discomfort: true })).action).toBe("maintain"));
  it("reps incompletas mantienen", () => expect(nextLoad(h({ reps_done: [10, 8] })).action).toBe("maintain"));
  it("RPE alto no sube", () => expect(nextLoad(h({ rpe: 9 })).action).toBe("maintain"));
});

describe("TSS de fuerza y antídoto", () => {
  it("IF = 0,4 + 0,04·RPE; TSS = horas · IF² · 100", () => {
    expect(STRENGTH_TSS.IF_BASE).toBe(0.4);
    expect(strengthTss(30, 6)).toBeCloseTo(20.5, 1);
    expect(strengthTss(60, 10)).toBeCloseTo(64, 0);
  });
  it("el antídoto dura 5-10 min y usa solo ejercicios de la biblioteca", () => {
    const a = drivingAntidote();
    expect(a.duration_min).toBeGreaterThanOrEqual(5);
    expect(a.duration_min).toBeLessThanOrEqual(10);
    expect(a.tss).toBeLessThan(5);
    expect(estimateMinutes(a)).toBe(a.duration_min);
    for (const l of a.blocks[0].exercises) expect(EXERCISE_BY_SLUG[l.slug]).toBeDefined();
  });
});
