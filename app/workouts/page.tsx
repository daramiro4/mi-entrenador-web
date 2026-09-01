import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWorkoutsForUser } from "@/lib/workouts";
import { LinkButton } from "@/components/ui/Button";
import { WorkoutsList } from "@/components/workouts/WorkoutsList";

export default async function WorkoutsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const workouts = await getWorkoutsForUser(supabase, user.id);

  return (
    <main className="flex-1 px-6 py-10 md:py-16">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <p className="font-display text-3xl uppercase tracking-wide text-paper">
            Plantillas de entreno
          </p>
          <LinkButton href="/workouts/new">Nueva</LinkButton>
        </div>
        <WorkoutsList workouts={workouts} />
      </div>
    </main>
  );
}
