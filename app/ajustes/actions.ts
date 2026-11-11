"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveSeason, setSeasonProvisionalFtp } from "@/lib/seasons";
import { validateProvisionalFtp } from "@/lib/ftp-base";

export type SaveFtpResult = { ok: true; value: number } | { ok: false; error: string };

/** Guarda el FTP provisional (p. ej. la estimación de Garmin) en la temporada activa. No toca `ftp_history`. */
export async function saveProvisionalFtpAction(raw: string): Promise<SaveFtpResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = validateProvisionalFtp(raw);
  if (!parsed.ok) return parsed;

  const season = await getActiveSeason(supabase, user.id);
  if (!season) return { ok: false, error: "Aún no tienes una temporada activa." };

  await setSeasonProvisionalFtp(supabase, user.id, season, parsed.value);
  revalidatePath("/ajustes");
  revalidatePath("/dashboard");
  return { ok: true, value: parsed.value };
}
