"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { archiveActiveSeason, createSeason } from "@/lib/seasons";
import type { NewSeasonInput } from "@/lib/types";

export async function submitOnboarding(
  input: NewSeasonInput
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await archiveActiveSeason(supabase, user.id);
  const { error } = await createSeason(supabase, user.id, input);

  if (error) {
    return { error };
  }

  redirect("/dashboard");
}
