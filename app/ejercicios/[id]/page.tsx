import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/ui/AppShell";
import { ExerciseDetailView, type AlternativeLink } from "@/components/exercises/ExerciseDetailView";
import { fetchCatalogList, fetchExerciseDetail } from "@/lib/exercises/data";
import { rowKey } from "@/lib/exercises/ui-types";

/** Ficha completa (enlace directo a un ejercicio). La lista de /ejercicios abre la misma ficha en una hoja. */
export default async function EjercicioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [detailRes, listRes] = await Promise.all([fetchExerciseDetail(supabase, id), fetchCatalogList(supabase)]);
  if (!detailRes.ok || !detailRes.data) notFound();
  const detail = detailRes.data;

  const rows = listRes.ok ? listRes.data.rows : [];
  const categories = listRes.ok ? listRes.data.categories : [];
  const byKey = new Map(rows.map((r) => [rowKey(r), r]));
  const alternatives: AlternativeLink[] = detail.alternatives.map((key) => {
    const r = byKey.get(key);
    return { key, name: r?.name_es ?? key, href: r ? `/ejercicios/${r.id}` : undefined };
  });
  const categoryName = categories.find((c) => c.garmin_category === detail.garmin_category)?.name_es ?? detail.garmin_category;

  return (
    <AppShell active="fuerza">
      <Link href="/ejercicios" className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm text-label-2 hover:text-label">
        <ArrowLeft size={18} aria-hidden="true" /> Biblioteca de ejercicios
      </Link>
      <div className="max-w-2xl">
        <ExerciseDetailView detail={detail} categoryName={categoryName} alternatives={alternatives} />
      </div>
    </AppShell>
  );
}
