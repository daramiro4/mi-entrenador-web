import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase/database.types";

export async function getProfileName(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<string | null> {
  const { data } = await supabase.from("profiles").select("name").eq("id", userId).maybeSingle();
  return data?.name?.trim() || null;
}
