import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LiveWorkout } from "@/components/strength/LiveWorkout";
import { DEFAULT_PREFS, getPrefs, getWorkoutById } from "@/lib/strength/data";
import { eligibleAlternatives } from "@/lib/strength/engine";

export default async function EntrenoPage(props: PageProps<"/fuerza/entreno/[id]">) {
  const { id } = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const workout = await getWorkoutById(supabase, user.id, id);
  if (!workout || workout.status === "done" || workout.status === "skipped") redirect("/fuerza");

  const { prefs } = await getPrefs(supabase, user.id);
  const p = prefs ?? DEFAULT_PREFS;
  const alternatives: Record<string, string[]> = {};
  for (const b of workout.blocks)
    for (const e of b.exercises) alternatives[e.slug] = eligibleAlternatives(e.slug, p, p.excluded_areas);

  return (
    <div className="flex-1">
      <LiveWorkout workout={workout} alternatives={alternatives} />
    </div>
  );
}
