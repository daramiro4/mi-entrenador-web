"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPlannedSessionById } from "@/lib/planned-sessions";
import { getLatestFtp } from "@/lib/metrics";
import { sendPlannedSessionToGarmin, type SendToGarminResult } from "@/lib/garmin";

export async function sendPlannedSessionToGarminAction(
  plannedSessionId: string
): Promise<SendToGarminResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const session = await getPlannedSessionById(supabase, user.id, plannedSessionId);
  if (!session) {
    return { ok: false, error: "No se encontró la sesión planificada." };
  }

  const latestFtp = await getLatestFtp(supabase, user.id);

  return sendPlannedSessionToGarmin(session, latestFtp?.ftp_watts ?? null);
}
