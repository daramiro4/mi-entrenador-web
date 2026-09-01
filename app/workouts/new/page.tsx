import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WorkoutForm } from "@/components/workouts/WorkoutForm";

export default async function NewWorkoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="flex-1 px-6 py-10 md:py-16">
      <div className="max-w-2xl mx-auto space-y-6">
        <p className="font-display text-3xl uppercase tracking-wide text-paper">
          Nueva plantilla
        </p>
        <WorkoutForm mode="create" />
      </div>
    </main>
  );
}
