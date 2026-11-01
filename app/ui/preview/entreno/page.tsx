import { notFound } from "next/navigation";
import { LiveWorkout } from "@/components/strength/LiveWorkout";
import { eligibleAlternatives } from "@/lib/strength/engine";
import * as fx from "../fixtures";

export default function PreviewEntreno() {
  if (process.env.UI_PREVIEW !== "1" && process.env.NODE_ENV === "production") notFound();
  const prefs = { days_per_week: 2, session_minutes: 30, equipment: ["bodyweight", "dumbbell", "band"] as never, level: 2 as const, limitations: [], excluded_areas: [] };
  const alternatives: Record<string, string[]> = {};
  for (const b of fx.strengthWorkout.blocks) for (const e of b.exercises) alternatives[e.slug] = eligibleAlternatives(e.slug, prefs);
  // Empieza ya en el primer ejercicio principal.
  const w = { ...fx.strengthWorkout, progress: { step: 4, done: {}, swaps: {}, started_at: "2026-11-01T08:00:00.000Z" } };
  return <LiveWorkout workout={w} alternatives={alternatives} />;
}
