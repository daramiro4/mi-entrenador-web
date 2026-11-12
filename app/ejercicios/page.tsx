import { redirect } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/ui/AppShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ExerciseCatalog } from "@/components/exercises/ExerciseCatalog";
import { fetchCatalogList } from "@/lib/exercises/data";

export const metadata = { title: "Ejercicios · Mi Entrenador" };

export default async function EjerciciosPage({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const result = await fetchCatalogList(supabase);
  const { e } = await searchParams;

  return (
    <AppShell active="fuerza">
      <h1 className="text-3xl">Biblioteca de ejercicios</h1>
      <p className="mb-6 mt-2 max-w-[65ch] text-sm text-label-2">
        Los ejercicios que acepta el reloj Garmin, con su ficha. Los marcados como borrador tienen contenido pendiente de revisión.
      </p>
      {result.ok ? (
        <ExerciseCatalog rows={result.data.rows} categories={result.data.categories} initialOpenId={e ?? null} />
      ) : (
        <GlassCard>
          <EmptyState icon={AlertCircle} text={`El catálogo de ejercicios no está disponible todavía: ${result.error}`} />
        </GlassCard>
      )}
    </AppShell>
  );
}
