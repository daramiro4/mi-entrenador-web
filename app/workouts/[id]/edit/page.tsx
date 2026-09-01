import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWorkoutById } from "@/lib/workouts";
import { WorkoutForm } from "@/components/workouts/WorkoutForm";

export default async function EditWorkoutPage(props: PageProps<"/workouts/[id]/edit">) {
  const { id } = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const workout = await getWorkoutById(supabase, user.id, id);
  if (!workout) {
    redirect("/workouts");
  }

  return (
    <main className="flex-1 px-6 py-10 md:py-16">
      <div className="max-w-2xl mx-auto space-y-6">
        <p className="font-display text-3xl uppercase tracking-wide text-paper">
          Editar plantilla
        </p>
        <WorkoutForm mode="edit" workout={workout} />
      </div>
    </main>
  );
}
