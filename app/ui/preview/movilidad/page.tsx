import { notFound } from "next/navigation";
import { AppShell } from "@/components/ui/AppShell";
import { MovilidadView } from "@/components/strength/MovilidadView";

export default function PreviewMovilidad() {
  if (process.env.UI_PREVIEW !== "1" && process.env.NODE_ENV === "production") notFound();
  return (
    <AppShell active="movilidad">
      <MovilidadView lastMonth={4} />
    </AppShell>
  );
}
