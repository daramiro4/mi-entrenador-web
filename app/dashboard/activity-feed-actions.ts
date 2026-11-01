"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRecentActivities } from "@/lib/activities";
import {
  getStrengthSessionsForActivities,
  groupStrengthSessionsByActivityId,
} from "@/lib/strength-sessions";
import type { ActivityRow, StrengthSessionRow } from "@/lib/types";

export interface LoadMoreActivitiesResult {
  activities: ActivityRow[];
  strengthSessionsByActivityId: Record<number, StrengthSessionRow[]>;
  hasMore: boolean;
}

export async function loadMoreActivitiesAction(
  offset: number,
  limit: number
): Promise<LoadMoreActivitiesResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const activities = await getRecentActivities(supabase, user.id, { limit, offset });
  const strengthActivityIds = activities
    .filter((a) => a.activity_type === "strength")
    .map((a) => a.id);
  const strengthSessions =
    strengthActivityIds.length > 0
      ? await getStrengthSessionsForActivities(supabase, user.id, strengthActivityIds)
      : [];

  return {
    activities,
    strengthSessionsByActivityId: groupStrengthSessionsByActivityId(strengthSessions),
    hasMore: activities.length === limit,
  };
}
