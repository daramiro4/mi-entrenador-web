import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { EXERCISES } from "@/lib/strength/library";
import { hasAnimation } from "./animation-map";
import type { Catalog } from "./catalog";
import { catalogKeyForSlug, LEGACY_CATALOG_KEY } from "./legacy-keys";

const catalog = JSON.parse(readFileSync("data/garmin-exercises.json", "utf8")) as Catalog;

describe("LEGACY_CATALOG_KEY", () => {
  it("coincide exactamente con legacy_slug del catálogo generado", () => {
    const esperado = Object.fromEntries(catalog.exercises.filter((e) => e.legacy_slug).map((e) => [e.legacy_slug, `${e.garmin_category}/${e.garmin_name}`]));
    expect(LEGACY_CATALOG_KEY).toEqual(esperado);
  });

  it("cada ejercicio del módulo de fuerza tiene su ficha", () => {
    for (const ex of EXERCISES) expect(catalogKeyForSlug(ex.slug), ex.slug).not.toBeNull();
  });

  it("devuelve null para un slug desconocido", () => {
    expect(catalogKeyForSlug("no-existe")).toBeNull();
  });

  it("los ejercicios con animación nueva dentro de la rutina son los esperados (la animación solo existe si hay rig)", () => {
    const animados = EXERCISES.filter((ex) => {
      const key = catalogKeyForSlug(ex.slug)!;
      const [cat, ...rest] = key.split("/");
      return hasAnimation(cat, rest.join("/"));
    }).map((e) => e.slug).sort();
    // Al añadir un rig a ANIMATION_MAP para un ejercicio de la rutina, este test falla a propósito: actualiza la lista.
    expect(animados).toEqual(["peso-muerto-barra", "peso-muerto-rumano", "rotacion-toracica", "sentadilla-goblet", "sentadilla-peso-corporal"]);
  });
});
