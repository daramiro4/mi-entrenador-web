import { redirect } from "next/navigation";
import { AppShell } from "@/components/ui/AppShell";
import { MovilidadView } from "@/components/strength/MovilidadView";
import { createClient } from "@/lib/supabase/server";
import { ANTIDOTE_NAME } from "@/lib/strength/antidote";
import { getRecentWorkouts } from "@/lib/strength/data";
import { addDays, todayISODate } from "@/lib/week";

export const metadata = { title: "Movilidad · Mi Entrenador" };

/** Movilidad en casa: el "antídoto de conducción" (rutina fija de ~6 min), separado de las rutinas de fuerza del gimnasio. */
export default async function MovilidadPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const since = addDays(todayISODate(), -29);
  const recent = await getRecentWorkouts(supabase, user.id, 60);
  const lastMonth = recent.missing ? null : recent.rows.filter((w) => w.name === ANTIDOTE_NAME && w.status === "done" && w.date >= since).length;

  return (
    <AppShell active="movilidad">
      <MovilidadView lastMonth={lastMonth} />
    </AppShell>
  );
}
