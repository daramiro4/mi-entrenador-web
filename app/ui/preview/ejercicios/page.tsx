import { notFound } from "next/navigation";
import { AppShell } from "@/components/ui/AppShell";
import { ExerciseCatalog } from "@/components/exercises/ExerciseCatalog";
import { loadStaticCatalog } from "@/lib/exercises/static-catalog";

/** Galería de desarrollo (solo con UI_PREVIEW=1): /ejercicios con el catálogo versionado, sin base de datos. ?e=CATEGORÍA/EJERCICIO abre su ficha. */
export default async function PreviewEjercicios({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  if (process.env.UI_PREVIEW !== "1" && process.env.NODE_ENV === "production") notFound();
  const { rows, categories, details } = loadStaticCatalog();
  const { e } = await searchParams;
  return (
    <AppShell active="fuerza">
      <h1 className="text-3xl">Biblioteca de ejercicios</h1>
      <p className="mb-6 mt-2 max-w-[65ch] text-sm text-label-2">
        Los ejercicios que acepta el reloj Garmin, con su ficha. Los marcados como borrador tienen contenido pendiente de revisión.
      </p>
      <ExerciseCatalog rows={rows} categories={categories} details={details} initialOpenId={e ?? null} />
    </AppShell>
  );
}
