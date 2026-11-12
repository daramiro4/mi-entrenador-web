import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { DoseRing } from "./DoseRing";
import { ExerciseDetailView } from "./ExerciseDetailView";
import { ExerciseFilters } from "./ExerciseFilters";
import { VirtualList } from "./VirtualList";
import { ExercisePicker } from "./ExercisePicker";
import { ExerciseThumb } from "./ExerciseThumb";
import { EMPTY_FILTERS, buildFacets } from "@/lib/exercises/search";
import { toDetail, toListRow } from "@/lib/exercises/data";
import type { ExerciseDetail, ExerciseListRow } from "@/lib/exercises/ui-types";

const detail = (o: Partial<ExerciseDetail> = {}): ExerciseDetail => ({
  id: "1", garmin_category: "WARM_UP", garmin_name: "STRETCH_90_90", name_es: "Movilidad de cadera 90/90", name_en: "90/90 Stretch",
  equipment: ["bodyweight"], primary_muscles: ["ABDUCTORS", "ADDUCTORS"], level: 2, review_status: "draft", archetype: "stretch",
  secondary_muscles: [], dose_default: { type: "time", seconds: 40 }, cues: ["Uno", "Dos", "Tres"], common_mistake: "Un error.",
  alternatives: ["WARM_UP/STRETCH_PIGEON_POSE"], name_es_status: "proposed", plan_eligible: false, ...o,
});

describe("DoseRing", () => {
  it("por tiempo: muestra el reloj completo, el botón Iniciar y el anillo accesible", () => {
    const html = renderToStaticMarkup(<DoseRing dose={{ type: "time", seconds: 40 }} />);
    expect(html).toContain("00:40");
    expect(html).toContain("Iniciar");
    expect(html).toContain('aria-label="Dosis: 40 segundos"');
  });
  it("por repeticiones: el número en el anillo y sin botón de cuenta atrás", () => {
    const html = renderToStaticMarkup(<DoseRing dose={{ type: "reps", reps: 10 }} />);
    expect(html).toContain(">10<");
    expect(html).toContain("repeticiones");
    expect(html).not.toContain("Iniciar");
  });
});

describe("ExerciseDetailView (ficha)", () => {
  const html = renderToStaticMarkup(<ExerciseDetailView detail={detail()} categoryName="Calentamiento" alternatives={[{ key: "WARM_UP/STRETCH_PIGEON_POSE", name: "Paloma", href: "/ejercicios/2" }]} />);

  it("orden de la ficha: metadatos, título, dosis, cómo hacerlo, error común, alternativas y clave del reloj", () => {
    const order = ["Calentamiento", ">Movilidad de cadera 90/90</h1>", "Dosis", "Cómo hacerlo", "Error común", "Alternativas", "En el reloj: warm up · stretch 90 90"].map((t) => html.indexOf(t));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it("título en Barlow (font-display) y línea de metadatos con categoría, nivel y material", () => {
    expect(html).toMatch(/<h1[^>]*font-display[^>]*>Movilidad de cadera 90\/90<\/h1>/);
    expect(html).toContain("Nivel 2");
    expect(html).toContain("Peso corporal");
  });

  it("error común y alternativas van plegados (<details>) y las alternativas enlazan a su ficha", () => {
    expect((html.match(/<details/g) ?? []).length).toBe(2);
    expect(html).toContain('href="/ejercicios/2"');
    expect(html).toContain("Paloma");
  });

  it("un borrador lo dice; los pasos salen de las claves; sin animación lo indica", () => {
    expect(html).toContain("Borrador: contenido pendiente de revisión");
    expect(html).toContain("Aún sin animación");
    expect((html.match(/<li class="flex gap-3/g) ?? []).length).toBeGreaterThanOrEqual(3);
  });

  it("un ejercicio revisado no muestra el aviso de borrador; sin dosis no pinta el anillo", () => {
    const h = renderToStaticMarkup(<ExerciseDetailView detail={detail({ review_status: "reviewed", dose_default: null, common_mistake: null })} categoryName="X" alternatives={[]} />);
    expect(h).not.toContain("Borrador");
    expect(h).not.toContain("Dosis");
    expect(h).not.toContain("<details");
  });

  it("un ejercicio con animación empieza cargándola (bajo demanda)", () => {
    const h = renderToStaticMarkup(<ExerciseDetailView detail={detail({ garmin_name: "THORACIC_ROTATION" })} categoryName="X" alternatives={[]} />);
    expect(h).toContain("Cargando animación");
  });

  it("sin colores hex sueltos (solo tokens)", () => {
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,6}\b/);
  });
});

describe("ExerciseFilters", () => {
  const rows: ExerciseListRow[] = [{ id: "1", garmin_category: "SQUAT", garmin_name: "A", name_es: "A", name_en: "A", equipment: ["dumbbell"], primary_muscles: ["QUADS"], level: 1, review_status: "reviewed", archetype: null }];
  const render = (f = EMPTY_FILTERS, shown = 1) =>
    renderToStaticMarkup(<ExerciseFilters filters={f} onChange={() => {}} facets={buildFacets(rows)} categoryNames={{ SQUAT: "Sentadilla" }} total={1553} shown={shown} />);

  it("búsqueda accesible, filtros en español con recuentos y objetivos de 44 px", () => {
    const html = render();
    expect(html).toContain('aria-label="Buscar ejercicio"');
    expect(html).toContain("Sentadilla (1)");
    expect(html).toContain("Mancuernas (1)");
    expect(html).toContain("Cuádriceps (1)");
    expect(html).toContain("Con animación");
    expect(html).toContain("Solo revisados");
    expect(html).toContain("min-h-11");
  });
  it("cuenta de resultados y botón de limpiar solo con filtros activos", () => {
    expect(render()).toContain("1553 ejercicios");
    expect(render()).not.toContain("Limpiar filtros");
    const active = render({ ...EMPTY_FILTERS, level: 1 }, 12);
    expect(active).toContain("12 de 1553 ejercicios");
    expect(active).toContain("Limpiar filtros");
  });
});

describe("VirtualList con el catálogo real", () => {
  const catalog = JSON.parse(readFileSync("data/garmin-exercises.json", "utf8")) as { exercises: { garmin_category: string; garmin_name: string }[] };
  const items = catalog.exercises;
  it("con 1.553 filas solo pinta una ventana pequeña, con la información de posición para lectores de pantalla", () => {
    const html = renderToStaticMarkup(
      <VirtualList items={items} itemHeight={76} height={600} label="Ejercicios" getKey={(e) => `${e.garmin_category}/${e.garmin_name}`} renderRow={(e) => <span>{e.garmin_name}</span>} onSelect={() => {}} activeKey={null} empty={<p>vacío</p>} />,
    );
    const rendered = (html.match(/role="option"/g) ?? []).length;
    expect(items.length).toBe(1553);
    expect(rendered).toBeGreaterThan(5);
    expect(rendered).toBeLessThan(30);
    expect(html).toContain('aria-setsize="1553"');
    expect(html).toContain('aria-posinset="1"');
    expect(html).toContain('role="listbox"');
  });
  it("sin resultados muestra el mensaje vacío", () => {
    const html = renderToStaticMarkup(<VirtualList items={[]} itemHeight={76} height={600} label="x" getKey={() => ""} renderRow={() => null} onSelect={() => {}} activeKey={null} empty={<p>vacío</p>} />);
    expect(html).toContain("vacío");
    expect(html).not.toContain("listbox");
  });
});

describe("ExerciseThumb y ExercisePicker", () => {
  it("sin animación, la miniatura es un icono neutro oculto a lectores de pantalla", () => {
    const html = renderToStaticMarkup(<ExerciseThumb category="PLANK" name="SIDE_PLANK" />);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("<svg");
  });
  it("el picker cerrado no pinta nada (se exporta para el módulo de fuerza)", () => {
    expect(renderToStaticMarkup(<ExercisePicker open={false} onClose={() => {}} onPick={() => {}} rows={[]} categories={[]} />)).toBe("");
  });
});

describe("conversión de filas de la base de datos", () => {
  it("toListRow valida y normaliza", () => {
    const r = toListRow({ id: "u", garmin_category: "SQUAT", garmin_name: "X", name_es: "N", name_en: "E", equipment: ["dumbbell", 3], primary_muscles: null, level: 2, review_status: "reviewed", archetype: "squat" });
    expect(r.equipment).toEqual(["dumbbell"]);
    expect(r.primary_muscles).toEqual([]);
    expect(r.level).toBe(2);
    expect(r.review_status).toBe("reviewed");
    expect(toListRow({ level: 7, review_status: "otro" }).level).toBeNull();
    expect(toListRow({ review_status: "otro" }).review_status).toBe("draft");
  });
  it("toDetail convierte la dosis y las listas", () => {
    expect(toDetail({ dose_default: { type: "time", seconds: 40 } }).dose_default).toEqual({ type: "time", seconds: 40 });
    expect(toDetail({ dose_default: { type: "reps", reps: 10 } }).dose_default).toEqual({ type: "reps", reps: 10 });
    expect(toDetail({ dose_default: { type: "raro" } }).dose_default).toBeNull();
    const d = toDetail({ cues: ["a", "b"], alternatives: ["SQUAT/X"], common_mistake: "x", plan_eligible: true });
    expect(d.cues).toEqual(["a", "b"]);
    expect(d.alternatives).toEqual(["SQUAT/X"]);
    expect(d.plan_eligible).toBe(true);
  });
});
