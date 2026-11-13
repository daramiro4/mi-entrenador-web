import Link from "next/link";
import { Activity, CalendarDays, Dumbbell, LineChart, PersonStanding } from "lucide-react";
import { NAV_ITEMS, type NavKey } from "./nav-items";

const ICONS = { hoy: Activity, plan: CalendarDays, fuerza: Dumbbell, movilidad: PersonStanding, progreso: LineChart } as const;

/** Tab bar inferior de vidrio (móvil). */
export function TabBar({ active }: { active: NavKey | null }) {
  return (
    <nav
      aria-label="Secciones"
      className="glass-bar fixed inset-x-0 bottom-0 z-30 flex sm:hidden border-t-[0.5px] border-separator"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {NAV_ITEMS.map((it) => {
        const Icon = ICONS[it.key];
        const on = it.key === active;
        return (
          <Link
            key={it.key}
            href={it.href}
            aria-current={on ? "page" : undefined}
            className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] ${on ? "text-accent" : "text-label-2"}`}
          >
            <Icon size={22} strokeWidth={1.75} aria-hidden="true" />
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
