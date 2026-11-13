import { notFound } from "next/navigation";
import { LiveWorkout } from "@/components/strength/LiveWorkout";
import * as fx from "../fixtures";

/** Entreno en vivo recién empezado: el primer paso es el cardio en cinta de 10 min. */
export default function PreviewEntrenoCardio() {
  if (process.env.UI_PREVIEW !== "1" && process.env.NODE_ENV === "production") notFound();
  const w = { ...fx.strengthWorkout, progress: { step: 0, done: {}, swaps: {}, started_at: "2026-11-01T08:00:00.000Z" } };
  return <LiveWorkout workout={w} alternatives={{}} />;
}
