"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { archiveActiveSeason } from "@/lib/seasons";

export async function archiveAndRestartOnboarding() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await archiveActiveSeason(supabase, user.id);
  redirect("/onboarding");
}
